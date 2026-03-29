import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entity/operation.entity';
import { OperationsService } from './operations.service';
import { AccountsModule } from '../accounts/accounts.module';
import { WebhookModule } from '../webhooks/webhook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation]),
    AccountsModule,
    WebhookModule,
  ],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
