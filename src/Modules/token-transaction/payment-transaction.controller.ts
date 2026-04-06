import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { TokenTransactionService } from './payment-transaction.service';
import { TgUser } from '../../Common/decorators/user.decorator';
import { TelegramGuard } from '../auth/telegram.guard';
import { Public } from 'src/Common/decorators/public.decorator';



@ApiTags('PaymentTransactions')
@Controller('token-transactions')
export class TokenTransactionController {
  constructor(private readonly service: TokenTransactionService) { }

  @Patch('settings/update')
  @UseGuards(TelegramGuard) // Защищаем гвардом
  @ApiOperation({ summary: 'Обновить глобальные цены (только для админа)' })
  async updateSettings(
    @TgUser('id') userId: string, // Получаем ID того, кто делает запрос
    @Body('tokenPriceRub') tokenPriceRub: number,
    @Body('tokenPriceStars') tokenPriceStars: number,
  ) {
    // Передаем userId в сервис для проверки прав
    return this.service.updateSettings(userId, tokenPriceRub, tokenPriceStars);
  }

  @Post('settings/reset')
  @UseGuards(TelegramGuard)
  @ApiOperation({ summary: 'Сбросить цены к стандартным (только для админа)' })
  async resetSettings(@TgUser('id') userId: string) {
    return this.service.resetSettings(userId);
  }

  @UseGuards(TelegramGuard)
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

  @UseGuards(TelegramGuard)
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

  @UseGuards(TelegramGuard)
  @Get('user-transactions')
  @ApiOperation({ summary: 'Получить историю транзакций текущего пользователя' })
  async getHistory(@TgUser('id') userId: string) {
    return this.service.findByUser(userId);
  }

  @Public()
  @Post('webhook/yookassa')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleYookassaWebhook(@Body() data: any) {
    return this.service.handleWebhook(data);
  }

  @UseGuards(TelegramGuard)
  @Post('create-stars-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать инвойс-ссылку для оплаты через Telegram Stars' })
  @ApiQuery({
    name: 'tokensAmount',
    required: true,
    enum: [100, 300, 1000, 5000],
    description: 'Количество покупаемых токенов'
  })
  @ApiResponse({ status: 201, description: 'Возвращает invoice_link от Telegram' })
  async createStarsOrder(
    @TgUser('id') userId: string,
    @Query('tokensAmount') tokensAmount: string
  ) {
    if (!tokensAmount) {
      throw new BadRequestException('tokensAmount обязателен');
    }
    return this.service.createStarsOrder(userId, Number(tokensAmount));
  }

  @UseGuards(TelegramGuard)
  @Post('create-stars-subscription-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать платеж по подписке через Telegram Stars' })
  @ApiQuery({
    name: 'amount',
    required: true,
    enum: [990, 2490, 4990],
    description: 'Сумма пакета подписки (эквивалент в рублях)'
  })
  @ApiResponse({ status: 201, description: 'Возвращает invoice_link от Telegram Stars' })
  async createStarsSubscriptionOrder(
    @TgUser('id') userId: string,
    @Query('amount') amount: string
  ) {
    if (!amount) {
      throw new BadRequestException('amount обязателен');
    }
    return this.service.createSubscriptionStar(userId, Number(amount));
  }

  @Public()
  @Post('webhook/telegram')
  @HttpCode(HttpStatus.OK) // Всегда возвращаем 200, чтобы Telegram не спамил ретраями
  @ApiExcludeEndpoint()
  async handleTelegramWebhook(@Body() update: any) {
    try {
      // 1. Предпроверка платежа (Pre-Checkout)
      if (update.pre_checkout_query) {
        await this.service.handlePreCheckoutQuery(update.pre_checkout_query.id);
        return { ok: true };
      }

      // 2. Успешный платеж (Successful Payment)
      // Проверяем наличие платежа в сообщении или в канале (если бот в канале)
      const message = update.message || update.edited_message;

      if (message?.successful_payment) {
        const payload = message.successful_payment.invoice_payload;
        const telegramPaymentId = message.successful_payment.telegram_payment_charge_id;

        await this.service.handleStarsPayment(payload, telegramPaymentId);

        // Опционально: здесь можно вызвать метод бота для отправки сообщения "Спасибо!"
        // или передать chatId в сервис
      }

      return { ok: true };
    } catch (error) {
      // Даже если упала база, возвращаем OK Телеграму, чтобы он не слал 
      // это же уведомление бесконечно. Ошибку просто логируем.
      console.error('Stars Webhook Error:', error.message);
      return { ok: true };
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Получить все транзакции (для админки)' })
  async findAll() {
    return this.service.findAll();
  }
}