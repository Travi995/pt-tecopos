import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Estado del sistema y circuit breakers' })
  getHealth() {
    const circuitBreakers = this.proxyService.getCircuitBreakerStatus();
    const dlq = this.proxyService.getDeadLetterQueue();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      circuitBreakers,
      deadLetterQueue: {
        count: dlq.length,
        recent: dlq.slice(-10),
      },
    };
  }
}
