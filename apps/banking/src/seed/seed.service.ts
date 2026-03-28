import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entity/account.entity';
import { Operation, OperationType } from '../operations/entity/operation.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.accountRepository.count();
    if (count > 0) {
      return;
    }

    const accounts = this.accountRepository.create([
      {
        accountNumber: 'ACC-001',
        holderName: 'John Doe',
        currency: 'USD',
        balance: 5000,
      },
      {
        accountNumber: 'ACC-002',
        holderName: 'Jane Smith',
        currency: 'EUR',
        balance: 3200,
      },
      {
        accountNumber: 'ACC-003',
        holderName: 'Carlos Lopez',
        currency: 'MXN',
        balance: 15000,
      },
    ]);

    const savedAccounts = await this.accountRepository.save(accounts);

    const operations = this.operationRepository.create([
      {
        accountId: savedAccounts[0].id,
        type: OperationType.DEPOSIT,
        amount: 2000,
        description: 'Initial deposit',
      },
      {
        accountId: savedAccounts[0].id,
        type: OperationType.WITHDRAWAL,
        amount: 500,
        description: 'ATM withdrawal',
      },
      {
        accountId: savedAccounts[1].id,
        type: OperationType.DEPOSIT,
        amount: 3200,
        description: 'Wire transfer received',
      },
      {
        accountId: savedAccounts[1].id,
        type: OperationType.TRANSFER,
        amount: 150,
        description: 'Transfer to savings',
      },
      {
        accountId: savedAccounts[2].id,
        type: OperationType.DEPOSIT,
        amount: 15000,
        description: 'Payroll deposit',
      },
    ]);

    await this.operationRepository.save(operations);
  }
}
