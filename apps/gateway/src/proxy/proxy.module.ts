import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProxyService } from './proxy.service';
import { AuthProxyController } from './auth-proxy.controller';
import { BankingProxyController } from './banking-proxy.controller';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'SSO_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'gateway-sso',
              brokers: [config.get<string>('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'gateway-sso-consumer',
            },
          },
        }),
      },
      {
        name: 'BANKING_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'gateway-banking',
              brokers: [config.get<string>('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'gateway-banking-consumer',
            },
          },
        }),
      },
    ]),
  ],
  controllers: [AuthProxyController, BankingProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
