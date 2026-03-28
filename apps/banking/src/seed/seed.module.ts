import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entity/account.entity';
import { Operation } from '../operations/entity/operation.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Operation])],
  providers: [SeedService],
})
export class SeedModule {}
