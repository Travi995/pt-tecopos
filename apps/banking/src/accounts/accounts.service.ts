import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entity/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  findAll(userId?: string): Promise<Account[]> {
    if (userId) {
      return this.accountRepository.find({ where: { userId } });
    }
    return this.accountRepository.find();
  }

  async findOne(id: string, userId?: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account not found`);
    }
    if (userId && account.userId && account.userId !== userId) {
      throw new ForbiddenException(`Access to this account is not allowed`);
    }
    return account;
  }

  save(account: Account): Promise<Account> {
    return this.accountRepository.save(account);
  }
}
