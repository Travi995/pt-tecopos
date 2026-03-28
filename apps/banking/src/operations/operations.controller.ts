import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { Operation } from './operation.entity';

@ApiTags('operations')
@Controller('accounts/:accountId/operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  @ApiOperation({ summary: 'List operations for an account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'List of operations' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findByAccount(@Param('accountId') accountId: string): Promise<Operation[]> {
    return this.operationsService.findByAccount(accountId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an operation for an account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 201, description: 'Operation created' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  create(
    @Param('accountId') accountId: string,
    @Body() dto: CreateOperationDto,
  ): Promise<Operation> {
    return this.operationsService.create(accountId, dto);
  }
}
