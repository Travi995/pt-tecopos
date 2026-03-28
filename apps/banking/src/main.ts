import { NestFactory } from '@nestjs/core';
import { BankingModule } from './banking.module';

async function bootstrap() {
  const app = await NestFactory.create(BankingModule);
  await app.listen(3002);
}
bootstrap();
