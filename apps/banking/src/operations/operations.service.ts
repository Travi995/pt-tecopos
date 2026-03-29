import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Operation, OperationType } from './entity/operation.entity';
import { CreateOperationDto } from './dto/create-operation.dto';
import { Account } from '../accounts/entity/account.entity';
import { AccountsService } from '../accounts/accounts.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly accountsService: AccountsService,
    private readonly webhookService: WebhookService,
    private readonly dataSource: DataSource,
  ) {}

  async findByAccount(accountId: string): Promise<Operation[]> {
    return this.operationRepository.find({ where: { accountId } });
  }

  async create(accountId: string, dto: CreateOperationDto, userId?: string): Promise<Operation> {
    await this.accountsService.findOne(accountId, userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new BadRequestException('Account not found');
      }

      const balance = Number(account.balance);
      const amount = Number(dto.amount);

      if (dto.type === OperationType.WITHDRAWAL || dto.type === OperationType.TRANSFER) {
        if (balance < amount) {
          throw new BadRequestException('Insufficient balance');
        }
        account.balance = balance - amount;
      } else if (dto.type === OperationType.DEPOSIT) {
        account.balance = balance + amount;
      }

      await queryRunner.manager.save(Account, account);

      const operation = queryRunner.manager.create(Operation, { ...dto, accountId });
      const saved = await queryRunner.manager.save(Operation, operation);

      await queryRunner.commitTransaction();
      await this.webhookService.notify(saved);
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
