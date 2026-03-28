import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { AuthProxyController } from './auth-proxy.controller';
import { BankingProxyController } from './banking-proxy.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AuthProxyController, BankingProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
