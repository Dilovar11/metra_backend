import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenBalanceService } from './token-balance.service';
import { CreateTokenBalanceDto } from './dto/create-token-balance.dto';

@ApiTags('TokenBalance')
@Controller('token-balances')
export class TokenBalanceController {
  constructor(private readonly service: TokenBalanceService) {}

  @Post()
  @ApiOperation({ summary: 'Создать баланс токенов' })
  @ApiResponse({ status: 201, description: 'Баланс создан' })
  create(@Body() dto: CreateTokenBalanceDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все балансы (admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Баланс пользователя' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }
}
