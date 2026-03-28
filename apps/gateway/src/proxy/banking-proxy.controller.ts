import { Controller, Get, Post, Param, Body, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateOperationDto } from './dto/create-operation.dto';

interface ProxyRequest {
  headers: { authorization?: string };
}

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class BankingProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @ApiOperation({ summary: 'List all bank accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async findAll(@Req() req: ProxyRequest) {
    return this.proxyService.forwardToBanking('GET', '/accounts', undefined, {
      authorization: req.headers.authorization,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: ProxyRequest) {
    return this.proxyService.forwardToBanking('GET', `/accounts/${id}`, undefined, {
      authorization: req.headers.authorization,
    });
  }

  @Get(':id/operations')
  @ApiOperation({ summary: 'List operations for an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'List of operations' })
  async findOperations(@Param('id', ParseUUIDPipe) id: string, @Req() req: ProxyRequest) {
    return this.proxyService.forwardToBanking(
      'GET',
      `/accounts/${id}/operations`,
      undefined,
      { authorization: req.headers.authorization },
    );
  }

  @Post(':id/operations')
  @ApiOperation({ summary: 'Create a new operation' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 201, description: 'Operation created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createOperation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateOperationDto,
    @Req() req: ProxyRequest,
  ) {
    return this.proxyService.forwardToBanking(
      'POST',
      `/accounts/${id}/operations`,
      body as unknown as Record<string, unknown>,
      { authorization: req.headers.authorization },
    );
  }
}
