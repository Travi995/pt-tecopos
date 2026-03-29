import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Operation } from '../operations/entity/operation.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private isAllowedUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      const blocked = ['localhost', '127.', '0.0.0.0', '169.254.', '10.', '192.168.', '::1'];
      return !blocked.some((b) => parsed.hostname.startsWith(b));
    } catch {
      return false;
    }
  }

  async notify(operation: Operation): Promise<void> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');
    if (!webhookUrl) {
      return;
    }
    if (!this.isAllowedUrl(webhookUrl)) {
      this.logger.warn(`WEBHOOK_URL rejected: must be a public HTTPS URL`);
      return;
    }
    try {
      await firstValueFrom(this.httpService.post(webhookUrl, operation, { timeout: 5000 }));
      this.logger.log(`Webhook notification sent for operation ${operation.id}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook notification: ${(error as Error).message}`);
    }
  }
}
