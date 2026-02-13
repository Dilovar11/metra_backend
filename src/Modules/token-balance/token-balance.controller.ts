import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenBalanceService } from './token-balance.service';
import { CreateTokenBalanceDto } from './dto/create-token-balance.dto';
import { SubtractTokensDto } from './dto/subtract-tokens.dto';

@ApiTags('TokenBalance')
@Controller('token-balances')
export class TokenBalanceController {
  constructor(private readonly service: TokenBalanceService) { }

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

  @Post('subtract')
  @ApiOperation({ summary: 'Списать токены с баланса пользователя' })
  @ApiResponse({ status: 200, description: 'Токены успешно списаны' })
  @ApiResponse({ status: 400, description: 'Недостаточно средств' })
  @ApiResponse({ status: 404, description: 'Баланс не найден' })
  async subtract(@Body() dto: SubtractTokensDto) {
    return this.service.subtractTokens(dto.userId, dto.tokens, dto.reason);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Баланс пользователя' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }
}
