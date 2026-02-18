import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { TokenTransactionService } from './payment-transaction.service';
import { TgUser } from '../../Common/decorators/user.decorator'; 
import { TelegramGuard } from '../auth/telegram.guard';



@ApiTags('PaymentTransactions')
@Controller('token-transactions')
@UseGuards(TelegramGuard)
export class TokenTransactionController {
  constructor(private readonly service: TokenTransactionService) { }

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать платеж в ЮKassa и получить ссылку на оплату' })
  @ApiQuery({
    name: 'tokensAmount',
    required: true,
    enum: [100, 300, 1000, 5000],
    description: 'Количество покупаемых токенов'
  })
  @ApiResponse({ status: 201, description: 'Возвращает URL для редиректа на оплату' })
  async createOrder(
    @TgUser('id') userId: string, 
    @Query('tokensAmount') tokensAmount: string
  ) {
    if (!tokensAmount) {
      throw new BadRequestException('tokensAmount обязателен');
    }
    return this.service.createAcquiringOrder(userId, Number(tokensAmount));
  }

  @Post('create-subscription-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать платеж по подписке (subscription)' })
  @ApiQuery({
    name: 'amount',
    required: true,
    enum: [990, 2490, 4990],
    description: 'Сумма пакета в рублях'
  })
  @ApiResponse({ status: 201, description: 'Возвращает URL для оплаты' })
  async createCustomOrder(
    @TgUser('id') userId: string,
    @Query('amount') amount: string
  ) {
    if (!amount) {
      throw new BadRequestException('amount обязателен');
    }
    return this.service.createSubscribAcquiringOrder(userId, Number(amount));
  }

  @Get('user-transactions')
  @ApiOperation({ summary: 'Получить историю транзакций текущего пользователя' })
  async getHistory(@TgUser('id') userId: string) {
    return this.service.findByUser(userId);
  }

  @Post('webhook/yookassa')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() 
  async handleYookassaWebhook(@Body() data: any) {
    return this.service.handleWebhook(data);
  }

  @Get('all')
  @ApiOperation({ summary: 'Получить все транзакции (для админки)' })
  async findAll() {
    return this.service.findAll();
  }
}