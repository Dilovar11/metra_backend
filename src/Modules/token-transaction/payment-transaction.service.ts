import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../Entities/user.entity';
import { PaymentTransaction } from '../../Entities/payment-transaction';
import { TokenBalanceService } from '../token-balance/token-balance.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Referral } from '../../Entities/referral.entity';
import { PaymentSettings } from 'src/Entities/payment-settings.entity';

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

@Injectable()
export class TokenTransactionService {

  private readonly SHOP_ID = '1272019';
  private readonly SECRET_KEY = 'test_ZuHKwKoGiARiU9TNoKNpQ2R5BmTCQ3vyYRZ5wZvvSnU';
  constructor(

    @InjectRepository(PaymentTransaction) private transactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(Referral) private referralRepo: Repository<Referral>,

    @InjectRepository(User) private userRepo: Repository<User>,

    @InjectRepository(PaymentSettings) private settingsRepo: Repository<PaymentSettings>,

    private tokenBalanceService: TokenBalanceService

  ) {
  }

  // Вспомогательный метод для получения актуальных цен
  public async getSettings() {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      // Если записи нет, создаем дефолтную
      settings = this.settingsRepo.create({ id: 1, tokenPriceRub: 3.9, tokenPriceStars: 0.1 });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  // Вспомогательный метод проверки прав админа
  private checkAdminAccess(userId: string) {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    if (userId !== adminId) {
      throw new ForbiddenException('У вас нет прав для изменения настроек цен');
    }
  }

  // 1. Изменение цен с проверкой ID
  async updateSettings(userId: string, tokenPriceRub?: number, tokenPriceStars?: number) {
    this.checkAdminAccess(userId); // Проверка!

    let settings = await this.getSettings();

    if (tokenPriceRub !== undefined) settings.tokenPriceRub = tokenPriceRub;
    if (tokenPriceStars !== undefined) settings.tokenPriceStars = tokenPriceStars;

    await this.settingsRepo.save(settings);
    return {
      message: 'Цены обновлены админом',
      settings
    };
  }

  // 2. Сброс цен с проверкой ID
  async resetSettings(userId: string) {
    this.checkAdminAccess(userId); // Проверка!

    let settings = await this.getSettings();

    // Твои стандартные значения
    settings.tokenPriceRub = 8.25;
    settings.tokenPriceStars = 3.33;

    await this.settingsRepo.save(settings);
    return {
      message: 'Цены сброшены админом к дефолтным',
      settings
    };
  }


  async createAcquiringOrder(userId: string, tokensAmount: number) {
    // Важно: подгружаем инвайтера через relations
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['inviter']
    });

    if (!user) throw new NotFoundException('User not found');

    const settings = await this.getSettings();
    // Динамический расчет: количество * цену из БД
    const amountValue = tokensAmount * settings.tokenPriceRub;

    if (!amountValue) throw new BadRequestException('Invalid tokens amount');

    // Исправлено: добавляем referralBonus, чтобы база не ругалась
    let referralBonus = 0.00
    if (user.inviter) {
      referralBonus = amountValue * 0.25
    }

    const transaction = this.transactionRepo.create({
      amount: amountValue,
      tokens: tokensAmount,
      referralBonus: referralBonus,
      user: user,
      inviter: user.inviter || null,
      status: 'PENDING',
      type: "YOOKASSA"
    });

    await this.transactionRepo.save(transaction);

    const createPayload = {
      amount: {
        value: amountValue.toFixed(2),
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://metra-front.vercel.app/profile',
      },
      description: `Пополнение: ${tokensAmount} токенов`,
      metadata: {
        order_id: transaction.id,
      }
    };

    const auth = Buffer.from(`${this.SHOP_ID}:${this.SECRET_KEY}`).toString('base64');

    try {
      const response = await axios.post(
        'https://api.yookassa.ru/v3/payments',
        createPayload,
        {
          headers: {
            'Idempotence-Key': uuidv4(),
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      transaction.externalId = response.data.id;
      await this.transactionRepo.save(transaction);

      return {
        url: response.data.confirmation.confirmation_url,
        paymentId: response.data.id
      };

    } catch (error) {
      console.error('Yookassa API Error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.description || 'Ошибка при связи с ЮKassa'
      );
    }
  }


  async createSubscribAcquiringOrder(userId: string, amountValue: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['inviter']
    });

    if (!user) throw new NotFoundException('User not found');

    // 1. Получаем динамические настройки цен
    const settings = await this.getSettings();

    const tokensAmount = Math.floor(amountValue / settings.tokenPriceRub);

    if (tokensAmount <= 0) {
      throw new BadRequestException('Сумма платежа слишком мала для покупки токенов');
    }

    // 3. Рассчитываем реферальный бонус (25% от суммы в рублях)
    let referralBonus = 0.00;
    if (user.inviter) {
      referralBonus = amountValue * 0.25;
    }

    // 4. Создаем транзакцию в БД
    const transaction = this.transactionRepo.create({
      amount: amountValue,
      tokens: tokensAmount,
      referralBonus: referralBonus,
      user: user,
      inviter: user.inviter || null,
      status: 'PENDING',
      type: "YOOKASSA"
    });

    await this.transactionRepo.save(transaction);

    // 5. Формируем payload для ЮKassa
    const createPayload = {
      amount: {
        value: amountValue.toFixed(2),
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://metra-front.vercel.app/profile',
      },
      description: `Подписка: ${tokensAmount} токенов (Пакет ${amountValue} руб.)`,
      metadata: {
        order_id: transaction.id,
      }
    };

    const auth = Buffer.from(`${this.SHOP_ID}:${this.SECRET_KEY}`).toString('base64');

    try {
      const response = await axios.post(
        'https://api.yookassa.ru/v3/payments',
        createPayload,
        {
          headers: {
            'Idempotence-Key': uuidv4(),
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      transaction.externalId = response.data.id;
      await this.transactionRepo.save(transaction);

      return {
        url: response.data.confirmation.confirmation_url,
        paymentId: response.data.id
      };

    } catch (error) {
      console.error('Yookassa Subscription API Error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.description || 'Ошибка при связи с ЮKassa'
      );
    }
  }


  async handleWebhook(data: any) {
    // 1. Проверяем событие (ЮKassa присылает уведомление при успешной оплате)
    if (data.event !== 'payment.succeeded') {
      console.log(`[Webhook] Пропускаем событие: ${data.event}`);
      return;
    }

    const payment = data.object;
    const orderId = payment.metadata?.order_id;

    if (!orderId) {
      console.error('[Webhook] Ошибка: В метаданных платежа отсутствует order_id');
      return;
    }

    // Находим транзакцию
    const transaction = await this.transactionRepo.findOne({
      where: { id: orderId },
      relations: ['user'] // Подгружаем пользователя, совершившего покупку
    });

    if (!transaction) {
      console.error(`[Webhook] Транзакция ${orderId} не найдена в базе`);
      return;
    }

    // Защита от повторной обработки
    if (transaction.status !== 'PENDING') {
      console.log(`[Webhook] Транзакция ${orderId} уже обработана (статус: ${transaction.status})`);
      return;
    }

    try {
      // 2. ИЩЕМ ПРИГЛАСИВШЕГО (Интеграция логики processPayment)
      // Мы проверяем, есть ли у текущего покупателя пригласитель (inviter)
      const referralRelation = await this.referralRepo.findOne({
        where: { invited: { id: transaction.user.id } },
        relations: ['inviter']
      });

      if (referralRelation) {
        // Считаем 25% бонуса от суммы транзакции
        const bonus = Number(transaction.amount) * 0.25;
        transaction.inviter = referralRelation.inviter;
        transaction.referralBonus = bonus;

        console.log(`[Webhook] Реферальная связь найдена. Инвайтер: ${transaction.inviter.id}, Бонус: ${bonus}`);
      }

      // 3. Обновляем статус транзакции
      transaction.status = 'SUCCESS';
      transaction.externalId = payment.id; // ID платежа в системе ЮKassa
      await this.transactionRepo.save(transaction);

      // 4. Начисление токенов покупателю
      const purchasedTokens = transaction.tokens;
      if (purchasedTokens > 0) {
        await this.tokenBalanceService.addTokens(transaction.user.id, purchasedTokens);
        console.log(`[Webhook] Начислено ${purchasedTokens} токенов пользователю ${transaction.user.id}`);
      }

      // 5. Начисление бонуса пригласившему (если он есть)
      if (transaction.inviter && transaction.referralBonus > 0) {
        await this.tokenBalanceService.addBonus(transaction.inviter.id, transaction.referralBonus);
        console.log(`[Webhook] Бонус ${transaction.referralBonus} руб. начислен пригласившему ${transaction.inviter.id}`);
      }

    } catch (error) {
      console.error(`[Webhook] Ошибка при обработке транзакции ${orderId}:`, error);
      throw error;
    }
  }


  //--------------------------------------------------------------------------------
  // ОПЛАТА ЧЕРЕЗ STARS
  //--------------------------------------------------------------------------------

  async createStarsOrder(userId: string, tokensAmount: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['inviter'],
    });

    if (!user) throw new NotFoundException('User not found');

    // Карта цен в Звездах (XTR)
    const settings = await this.getSettings();
    // Расчет в звездах
    const amountValue = Math.round(tokensAmount * settings.tokenPriceStars);

    if (!amountValue) throw new BadRequestException('Invalid tokens amount');

    let referralBonus = 0.0;
    if (user.inviter) {
      // 25% бонуса, если вы начисляете его тоже в звездах или эквиваленте
      referralBonus = 0;
    }

    // 1. Создаем транзакцию в нашей БД
    const transaction = this.transactionRepo.create({
      amount: amountValue,
      tokens: tokensAmount,
      referralBonus: referralBonus,
      user: user,
      inviter: user.inviter || null,
      status: 'PENDING',
      type: "STARS"
    });

    await this.transactionRepo.save(transaction);

    // 2. Формируем инвойс-ссылку через Telegram API
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/createInvoiceLink`, {
        title: `Пополнение: ${tokensAmount} токенов`,
        description: `Добавление токенов в Metra через Telegram Stars`,
        payload: transaction.id.toString(), // Это вернется к нам в вебхуке
        currency: 'XTR',
        prices: [{ label: 'Токены', amount: amountValue }],
      });

      if (!response.data.ok) {
        throw new Error(response.data.description);
      }

      return {
        url: response.data.result,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('Telegram Stars Error:', error.message);
      throw new BadRequestException('Ошибка при создании платежа Stars');
    }
  }


  async createSubscriptionStar(userId: string, amountValueRub: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['inviter'],
    });

    if (!user) throw new NotFoundException('User not found');

    // 1. Получаем настройки цен из БД
    const settings = await this.getSettings();

    // 2. Рассчитываем количество токенов на основе пришедшей суммы в рублях
    // Например: 990 руб / 8.25 (цена за токен) = 120 токенов
    const tokensAmount = Math.floor(amountValueRub / settings.tokenPriceRub);

    if (tokensAmount <= 0) {
      throw new BadRequestException('Сумма слишком мала для покупки токенов');
    }

    // 3. Рассчитываем итоговую стоимость в Звездах (XTR)
    // Например: 120 токенов * 3.33 (цена в звездах) = 400 звезд
    const starsAmount = Math.round(tokensAmount * settings.tokenPriceStars);

    // 4. Расчет реферального бонуса (25%)
    // Бонус считается в звездах, так как тип транзакции STARS
    let referralBonus = 0.0;
    if (user.inviter) {
      referralBonus = 0;
    }

    // 5. Создаем транзакцию в БД
    const transaction = this.transactionRepo.create({
      amount: starsAmount,        // Сумма в звездах
      tokens: tokensAmount,       // Количество токенов
      referralBonus: referralBonus,
      user: user,
      inviter: user.inviter || null,
      status: 'PENDING',
      type: "STARS"
    });

    await this.transactionRepo.save(transaction);

    // 6. Генерация ссылки через Telegram API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    try {
      const response = await axios.post(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
        title: `Подписка: ${tokensAmount} токенов`,
        description: `Премиум пакет токенов Metra (${starsAmount} Stars)`,
        payload: transaction.id.toString(),
        currency: 'XTR',
        prices: [{
          label: `Пакет ${tokensAmount} токенов`,
          amount: starsAmount // Должно быть целым числом
        }],
      });

      if (!response.data.ok) {
        throw new Error(response.data.description);
      }

      return {
        url: response.data.result,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('Telegram Subscription Stars Error:', error.response?.data || error.message);
      throw new BadRequestException('Ошибка при создании платежа в Telegram Stars');
    }
  }

  // Метод для подтверждения транзакции после успешной оплаты Stars
  // (Вызывается из вашего контроллера вебхуков Telegram)
  async handleStarsPayment(payload: string, telegramPaymentId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: payload },
      relations: ['user', 'inviter'],
    });

    if (!transaction || transaction.status !== 'PENDING') return;

    // Используем вашу готовую логику начисления
    transaction.status = 'SUCCESS';
    transaction.externalId = telegramPaymentId;
    await this.transactionRepo.save(transaction);

    await this.tokenBalanceService.addTokens(transaction.user.id, transaction.tokens);

    if (transaction.inviter && transaction.referralBonus > 0) {
      await this.tokenBalanceService.addBonus(transaction.inviter.id, transaction.referralBonus);
    }

    return { success: true };
  }


  async handlePreCheckoutQuery(preCheckoutQueryId: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        pre_checkout_query_id: preCheckoutQueryId,
        ok: true, // true означает, что товар в наличии и всё хорошо
      });
    } catch (error) {
      console.error('Error answering pre_checkout_query:', error.message);
    }
  }


  async handleTelegramUpdate(update: any) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // 1. ОТВЕТ НА ПРЕДПРОВЕРКУ (ОБЯЗАТЕЛЬНО)
    if (update.pre_checkout_query) {
      await axios.post(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        pre_checkout_query_id: update.pre_checkout_query.id,
        ok: true,
      });
      return { ok: true };
    }

    // 2. ПОДТВЕРЖДЕНИЕ УСПЕШНОЙ ОПЛАТЫ
    const message = update.message;
    if (message && message.successful_payment) {
      const transactionId = message.successful_payment.invoice_payload; // тот ID, что мы передавали при создании ссылки
      const telegramChargeId = message.successful_payment.telegram_payment_charge_id;

      // Вызываем вашу общую логику начисления (как для ЮKassa)
      await this.completeStarsTransaction(transactionId, telegramChargeId);
    }

    return { ok: true };
  }

  private async completeStarsTransaction(transactionId: string, externalId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
      relations: ['user', 'inviter']
    });

    if (!transaction || transaction.status !== 'PENDING') return;

    transaction.status = 'SUCCESS';
    transaction.externalId = externalId;
    await this.transactionRepo.save(transaction);

    // Начисляем токены пользователю
    await this.tokenBalanceService.addTokens(transaction.user.id, transaction.tokens);

    // Начисляем бонус рефералу
    if (transaction.inviter && transaction.referralBonus > 0) {
      await this.tokenBalanceService.addBonus(transaction.inviter.id, transaction.referralBonus);
    }
  }


  async findAll() {
    return await this.transactionRepo.find({
      relations: ['user', 'inviter'],
      order: {
        createdAt: 'DESC',
      },
    });
  }


  async findByUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return await this.transactionRepo.find({
      where: {
        user: { id: userId }
      },
      relations: ['inviter'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

}