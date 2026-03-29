import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
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
          retry: {
            initialRetryTime: 3000,
            retries: 10,
          },
        },
        consumer: {
          groupId: 'sso-consumer',
          allowAutoTopicCreation: true,
        },
      },
    },
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen();
  logger.log('SSO microservice listening on Kafka');
}
bootstrap();
