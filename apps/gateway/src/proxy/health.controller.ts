import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Estado de disponibilidad del sistema' })
  getHealth() {
    const circuitBreakers = this.proxyService.getCircuitBreakerStatus();
    const dlqCount = this.proxyService.getDeadLetterQueueCount();

    const services: Record<string, 'up' | 'degraded'> = {};
    for (const [name, cb] of Object.entries(circuitBreakers)) {
      services[name] = cb.state === 'open' ? 'degraded' : 'up';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services,
      deadLetterQueue: { count: dlqCount },
    };
  }
}
