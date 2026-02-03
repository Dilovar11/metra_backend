import { Controller, Post, Get, Body, Query, HttpCode, Req, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TokenTransactionService } from './token-transaction.service';
import { CreateTokenTransactionDto } from './dto/create-token-transaction.dto';

@ApiTags('TokenTransactions')
@Controller('token-transactions')
export class TokenTransactionController {
  constructor(private readonly service: TokenTransactionService) { }

  @Post('create')
  @ApiOperation({ summary: 'Создать заказ на пополнение токенов' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'uuid-пользователя', description: 'ID пользователя из базы' },
        tokensAmount: { type: 'number', example: 100 }
      },
      required: ['userId', 'tokensAmount']
    }
  })
  async createOrder(
    @Body('userId') userId: string, // Теперь берем из тела запроса, а не из req.user
    @Body('tokensAmount') tokensAmount: number
  ) {
    // Вызываем сервис с переданным userId
    return await this.service.createAcquiringOrder(userId, tokensAmount);
  }

  /**
   * На этот адрес банк пришлет данные после оплаты
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Прием уведомления от банка' })
  async handleBankCallback(@Body() data: any) {
    // В некоторых случаях банк присылает данные не в Body, а в Query
    // Если body пустой, можно попробовать прочитать из Query
    console.log('Bank Callback Data:', data);

    await this.service.handleCallback(data);

    // Банку нужно ответить "OK" или другим кодом, чтобы он не слал уведомление повторно
    return 'OK';
  }


  // 2. Эмуляция платежной страницы банка
  @Post('fake-bank-page')
  async fakeBank(@Body() body: any) {
    const { order_id, amount } = body;

    console.log(`[FakeBank] Пользователь "оплачивает" заказ ${order_id}...`);

    // Имитируем задержку банка 1 секунду
    await new Promise(res => setTimeout(res, 1000));

    // Сами вызываем свой же callback, как это сделал бы реальный банк
    return this.service.handleCallback({
      order_id: order_id,
      status: 'SUCCESS',
      bank_id: 'FAKE_DC_TRANS_' + Math.random().toString(36).toUpperCase().slice(2, 10),
      amount: amount
    });
  }


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
