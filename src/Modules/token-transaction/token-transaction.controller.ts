import { Controller, Post, Get, Body, Query, HttpCode, Req, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TokenTransactionService } from './token-transaction.service';

@ApiTags('TokenTransactions')
@Controller('token-transactions')
export class TokenTransactionController {
  constructor(private readonly service: TokenTransactionService) { }

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать платеж в ЮKassa и получить ссылку на оплату' })
  @ApiQuery({ name: 'userId', required: true, description: 'ID пользователя' })
  @ApiQuery({
    name: 'tokensAmount',
    required: true,
    enum: [100, 300, 1000, 5000],
    description: 'Количество покупаемых токенов'
  })
  @ApiResponse({ status: 201, description: 'Возвращает URL для редиректа на оплату' })
  async createOrder(
    @Query('userId') userId: string,
    @Query('tokensAmount') tokensAmount: string
  ) {
    if (!userId || !tokensAmount) {
      throw new BadRequestException('userId и tokensAmount обязательны');
    }

    // Преобразуем tokensAmount в число, так как из Query всё приходит строкой
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