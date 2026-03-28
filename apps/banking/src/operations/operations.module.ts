import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entity/operation.entity';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { WebhookModule } from '../webhooks/webhook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation]),
    AccountsModule,
    WebhookModule,
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
