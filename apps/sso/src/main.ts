import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SsoModule } from './sso.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SSO');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SsoModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'sso',
          brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
        },
        consumer: {
          groupId: 'sso-consumer',
        },
      },
    },
  );

  await app.listen();
  logger.log('SSO microservice listening on Kafka');
}
bootstrap();
