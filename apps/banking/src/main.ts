import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { BankingModule } from './banking.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Banking');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BankingModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'banking',
          brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
        },
        consumer: {
          groupId: 'banking-consumer',
        },
      },
    },
  );

  await app.listen();
  logger.log('Banking microservice listening on Kafka');
}
bootstrap();
