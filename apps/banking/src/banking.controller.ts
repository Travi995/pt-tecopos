import { Controller, Get } from '@nestjs/common';
import { BankingService } from './banking.service';

@Controller()
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Get()
  getHello(): string {
    return this.bankingService.getHello();
  }
}
