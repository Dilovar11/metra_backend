import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenBalanceService } from './token-balance.service';
import { CreateTokenBalanceDto } from './dto/create-token-balance.dto';
import { SubtractTokensDto } from './dto/subtract-tokens.dto';
import { TgUser } from '../../Common/decorators/user.decorator'; //

@ApiTags('TokenBalance')
@Controller('token-balances')
export class TokenBalanceController {
  constructor(private readonly service: TokenBalanceService) { }

  @Get('by-user')
  @ApiOperation({ summary: 'Получить баланс текущего пользователя' })
  async findByUser(@TgUser('id') userId: string) {
    return this.service.findByUser(userId);
  }

  @Post('subtract')
  @ApiOperation({ summary: 'Списать токены с баланса текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Токены успешно списаны' })
  @ApiResponse({ status: 400, description: 'Недостаточно средств' })
  async subtract(
    @TgUser('id') userId: string, 
    @Body() dto: Omit<SubtractTokensDto, 'userId'> // Исключаем userId из тела запроса для безопасности
  ) {
    return this.service.subtractTokens(userId, dto.tokens, dto.reason);
  }

  @Post()
  @ApiOperation({ summary: 'Создать баланс (Admin)' })
  create(@Body() dto: CreateTokenBalanceDto, @TgUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Все балансы (Admin)' })
  findAll() {
    return this.service.findAll();
  }
}