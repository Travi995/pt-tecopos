import { Injectable } from '@nestjs/common';

@Injectable()
export class BankingService {
  getHello(): string {
    return 'Hello World!';
  }
}
