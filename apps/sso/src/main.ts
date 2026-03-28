import { NestFactory } from '@nestjs/core';
import { SsoModule } from './sso.module';

async function bootstrap() {
  const app = await NestFactory.create(SsoModule);
  await app.listen(3001);
}
bootstrap();
