import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenTransactionService } from './token-transaction.service';
import { CreateTokenTransactionDto } from './dto/create-token-transaction.dto';

@ApiTags('TokenTransactions')
@Controller('token-transactions')
export class TokenTransactionController {
  constructor(private readonly service: TokenTransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Создать токен-транзакцию (меняет баланс)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateTokenTransactionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все транзакции (admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Транзакции пользователя' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }
}
