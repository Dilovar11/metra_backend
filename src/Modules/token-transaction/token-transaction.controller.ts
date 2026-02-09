import { Controller, Post, Get, Body, Query, HttpCode, Req, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TokenTransactionService } from './token-transaction.service';

@ApiTags('TokenTransactions')
@Controller('token-transactions')
export class TokenTransactionController {
  constructor(private readonly service: TokenTransactionService) { }

  @Post('create-order')
  @ApiOperation({ summary: 'Создать заказ на покупку токенов (ЮKassa)' })
  @ApiQuery({ name: 'userId', description: 'ID пользователя' })
  @ApiQuery({ name: 'tokensAmount', enum: [100, 300, 1000, 5000], description: 'Количество токенов' })
  async createOrder(
    @Query('userId') userId: string,
    @Query('tokensAmount') tokensAmount: string // Приходит строкой из Query
  ) {
    return this.service.createAcquiringOrder(userId, Number(tokensAmount));
  }

  @Post('webhook/yookassa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обработка уведомлений от ЮKassa' })
  @ApiBody({ description: 'Данные уведомления от ЮKassa' })
  async handleYookassaWebhook(@Body() data: any) {
    // Этот метод ЮKassa будет вызывать сама при успешной оплате
    return this.service.handleWebhook(data);
  }

  @Get('user-transactions')
  @ApiOperation({ summary: 'Получить историю транзакций пользователя' })
  @ApiQuery({ name: 'userId', required: true })
  async getHistory(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Получить все транзакции (для админки)' })
  async findAll() {
    return this.service.findAll();
  }
}