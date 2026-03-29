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

@Injectable()
export class ProxyService implements OnModuleInit {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    @Inject('SSO_SERVICE') private readonly ssoClient: ClientKafka,
    @Inject('BANKING_SERVICE') private readonly bankingClient: ClientKafka,
  ) {}

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

    await this.ssoClient.connect();
    await this.bankingClient.connect();
  }

  async sendToSso(
    pattern: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
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
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Kafka SSO error [${pattern}]: ${error.message}`);
      throw new HttpException(
        'SSO service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async sendToBanking(
    pattern: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
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
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Kafka Banking error [${pattern}]: ${error.message}`);
      throw new HttpException(
        'Banking service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
