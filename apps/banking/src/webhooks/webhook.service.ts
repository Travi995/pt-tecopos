import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Operation } from '../operations/operation.entity';

@Injectable()
export class WebhookService {
  constructor(private readonly httpService: HttpService) {}

  async notify(operation: Operation): Promise<void> {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }
    try {
      await firstValueFrom(this.httpService.post(webhookUrl, operation));
    } catch {
      return;
    }
  }
}
