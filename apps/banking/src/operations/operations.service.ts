import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from './entity/operation.entity';
import { CreateOperationDto } from './dto/create-operation.dto';
import { AccountsService } from '../accounts/accounts.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly accountsService: AccountsService,
    private readonly webhookService: WebhookService,
  ) {}

  async findByAccount(accountId: string): Promise<Operation[]> {
    await this.accountsService.findOne(accountId);
    return this.operationRepository.find({ where: { accountId } });
  }

  async create(accountId: string, dto: CreateOperationDto): Promise<Operation> {
    await this.accountsService.findOne(accountId);
    const operation = this.operationRepository.create({
      ...dto,
      accountId,
    });
    const saved = await this.operationRepository.save(operation);
    await this.webhookService.notify(saved);
    return saved;
  }
}
