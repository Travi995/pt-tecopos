import { Controller, Get } from '@nestjs/common';
import { SsoService } from './sso.service';

@Controller()
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Get()
  getHello(): string {
    return this.ssoService.getHello();
  }
}
