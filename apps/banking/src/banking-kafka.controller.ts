import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccountsService } from './accounts/accounts.service';
import { OperationsService } from './operations/operations.service';

@Controller()
export class BankingKafkaController {
  private readonly logger = new Logger(BankingKafkaController.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly operationsService: OperationsService,
  ) {}

  @MessagePattern('banking.accounts.findAll')
  async handleFindAll() {
    try {
      return await this.accountsService.findAll();
    } catch (error) {
      this.logger.error(`FindAll error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 500 };
    }
  }

  @MessagePattern('banking.accounts.findOne')
  async handleFindOne(@Payload() data: { id: string }) {
    try {
      return await this.accountsService.findOne(data.id);
    } catch (error) {
      this.logger.error(`FindOne error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 500 };
    }
  }

  @MessagePattern('banking.operations.findByAccount')
  async handleFindOperations(@Payload() data: { accountId: string }) {
    try {
      return await this.operationsService.findByAccount(data.accountId);
    } catch (error) {
      this.logger.error(`FindOperations error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 500 };
    }
  }

  @MessagePattern('banking.operations.create')
  async handleCreateOperation(
    @Payload()
    data: {
      accountId: string;
      type: string;
      amount: number;
      description?: string;
    },
  ) {
    try {
      return await this.operationsService.create(data.accountId, {
        type: data.type as any,
        amount: data.amount,
        description: data.description,
      });
    } catch (error) {
      this.logger.error(`CreateOperation error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 500 };
    }
  }
}
