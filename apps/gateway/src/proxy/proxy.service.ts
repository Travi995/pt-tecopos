import {
  Injectable,
  Inject,
  OnModuleInit,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

interface DeadLetterEntry {
  pattern: string;
  data: Record<string, unknown>;
  error: string;
  timestamp: Date;
  service: string;
}

@Injectable()
export class ProxyService implements OnModuleInit {
  private readonly logger = new Logger(ProxyService.name);

  private readonly circuitBreakers: Map<string, CircuitBreakerState> =
    new Map();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly COOLDOWN_MS = 30000;

  private readonly deadLetterQueue: DeadLetterEntry[] = [];
  private readonly DLQ_MAX_SIZE = 1000;

  constructor(
    @Inject('SSO_SERVICE') private readonly ssoClient: ClientKafka,
    @Inject('BANKING_SERVICE') private readonly bankingClient: ClientKafka,
  ) {
    this.circuitBreakers.set('sso', {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    });
    this.circuitBreakers.set('banking', {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    });
  }

  async onModuleInit() {
    const ssoTopics = [
      'sso.auth.register',
      'sso.auth.login',
      'sso.auth.profile',
    ];
    const bankingTopics = [
      'banking.accounts.findAll',
      'banking.accounts.findOne',
      'banking.operations.findByAccount',
      'banking.operations.create',
    ];

    ssoTopics.forEach((topic) => this.ssoClient.subscribeToResponseOf(topic));
    bankingTopics.forEach((topic) =>
      this.bankingClient.subscribeToResponseOf(topic),
    );

    await this.connectWithRetry(this.ssoClient, 'SSO');
    await this.connectWithRetry(this.bankingClient, 'Banking');
  }

  private async connectWithRetry(
    client: ClientKafka,
    name: string,
    retries = 10,
    delay = 3000,
  ) {
    for (let i = 0; i < retries; i++) {
      try {
        await client.connect();
        this.logger.log(`${name} Kafka client connected`);
        return;
      } catch (error) {
        this.logger.warn(
          `${name} Kafka connect attempt ${i + 1}/${retries} failed: ${error.message}`,
        );
        if (i === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private checkCircuitBreaker(service: string): void {
    const cb = this.circuitBreakers.get(service);
    if (!cb) return;

    if (cb.state === 'open') {
      const elapsed = Date.now() - cb.lastFailure;
      if (elapsed >= this.COOLDOWN_MS) {
        cb.state = 'half-open';
        this.logger.warn(
          `Circuit breaker [${service}]: HALF-OPEN (probando conexión)`,
        );
      } else {
        const remaining = Math.ceil((this.COOLDOWN_MS - elapsed) / 1000);
        throw new HttpException(
          `Service temporarily unavailable — retry in ${remaining}s`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }

  private onSuccess(service: string): void {
    const cb = this.circuitBreakers.get(service);
    if (!cb) return;

    if (cb.state === 'half-open') {
      this.logger.log(
        `Circuit breaker [${service}]: CLOSED (servicio recuperado)`,
      );
    }
    cb.failures = 0;
    cb.state = 'closed';
  }

  private onFailure(
    service: string,
    pattern: string,
    data: Record<string, unknown>,
    error: string,
  ): void {
    const cb = this.circuitBreakers.get(service);
    if (!cb) return;

    cb.failures++;
    cb.lastFailure = Date.now();

    if (cb.failures >= this.FAILURE_THRESHOLD) {
      cb.state = 'open';
      this.logger.error(
        `Circuit breaker [${service}]: OPEN después de ${cb.failures} fallos consecutivos`,
      );
    }

    this.addToDeadLetterQueue(service, pattern, data, error);
  }

  private addToDeadLetterQueue(
    service: string,
    pattern: string,
    data: Record<string, unknown>,
    error: string,
  ): void {
    const entry: DeadLetterEntry = {
      pattern,
      data,
      error,
      timestamp: new Date(),
      service,
    };

    if (this.deadLetterQueue.length >= this.DLQ_MAX_SIZE) {
      this.logger.error(`DLQ at max capacity (${this.DLQ_MAX_SIZE}), dropping oldest entry to make room`);
      this.deadLetterQueue.shift();
    }
    this.deadLetterQueue.push(entry);

    this.logger.warn(
      `DLQ [${service}]: mensaje fallido guardado — pattern=${pattern}, error=${error}, total_dlq=${this.deadLetterQueue.length}`,
    );
  }

  getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue];
  }

  getDeadLetterQueueCount(): number {
    return this.deadLetterQueue.length;
  }

  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((value, key) => {
      status[key] = { ...value };
    });
    return status;
  }

  async sendToSso(
    pattern: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    this.checkCircuitBreaker('sso');

    try {
      const result = await firstValueFrom(
        this.ssoClient.send(pattern, data).pipe(
          timeout(10000),
          catchError((err) => throwError(() => err)),
        ),
      );
      if (result && typeof result === 'object' && 'error' in result) {
        const errorResult = result as { error: string; statusCode: number };
        throw new HttpException(
          errorResult.error,
          errorResult.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      this.onSuccess('sso');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        if (error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE) {
          this.onFailure('sso', pattern, data, error.message);
        }
        throw error;
      }
      this.logger.error(`Kafka SSO error [${pattern}]: ${error.message}`);
      this.onFailure('sso', pattern, data, error.message);
      throw new HttpException(
        'Authentication service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async sendToBanking(
    pattern: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    this.checkCircuitBreaker('banking');

    try {
      const result = await firstValueFrom(
        this.bankingClient.send(pattern, data).pipe(
          timeout(10000),
          catchError((err) => throwError(() => err)),
        ),
      );
      if (result && typeof result === 'object' && 'error' in result) {
        const errorResult = result as { error: string; statusCode: number };
        throw new HttpException(
          errorResult.error,
          errorResult.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      this.onSuccess('banking');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        if (error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE) {
          this.onFailure('banking', pattern, data, error.message);
        }
        throw error;
      }
      this.logger.error(`Kafka Banking error [${pattern}]: ${error.message}`);
      this.onFailure('banking', pattern, data, error.message);
      throw new HttpException(
        'Banking service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
