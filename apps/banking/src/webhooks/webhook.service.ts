import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Operation } from '../operations/entity/operation.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly httpService: HttpService) {}

  async notify(operation: Operation): Promise<void> {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn('WEBHOOK_URL not configured, skipping notification');
      return;
    }
    try {
      await firstValueFrom(this.httpService.post(webhookUrl, operation));
      this.logger.log(`Webhook notification sent for operation ${operation.id}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook notification for operation ${operation.id}: ${(error as Error).message}`);
    }
  }
}
