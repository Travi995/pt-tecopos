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
          retry: {
            initialRetryTime: 3000,
            retries: 10,
          },
        },
        consumer: {
          groupId: 'banking-consumer',
          allowAutoTopicCreation: true,
        },
      },
    },
  );

  await app.listen();
  logger.log('Banking microservice listening on Kafka');
}
bootstrap();
