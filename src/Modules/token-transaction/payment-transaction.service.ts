import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../Entities/user.entity';
import { PaymentTransaction } from '../../Entities/payment-transaction';
import { TokenBalanceService } from '../token-balance/token-balance.service';
import { v4 as uuidv4 } from 'uuid'; 
import axios from 'axios';
import { Referral } from '../../Entities/referral.entity';

@Injectable()
export class TokenTransactionService {

  private readonly SHOP_ID = '1272019';
  private readonly SECRET_KEY = 'test_ZuHKwKoGiARiU9TNoKNpQ2R5BmTCQ3vyYRZ5wZvvSnU';
  constructor(

    @InjectRepository(PaymentTransaction) private transactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(Referral) private referralRepo: Repository<Referral>,

    @InjectRepository(User) private userRepo: Repository<User>,

    private tokenBalanceService: TokenBalanceService

  ) {
  }



  async createAcquiringOrder(userId: string, tokensAmount: number) {
    // Важно: подгружаем инвайтера через relations
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['inviter']
    });

    if (!user) throw new NotFoundException('User not found');

    const priceMap = { 100: 390, 300: 990, 1000: 2790, 5000: 11990 };
    const amountValue = priceMap[tokensAmount];
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
      status: 'PENDING'
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

    const tokenMap = { 990: 120, 2490: 350, 4990: 800 };
    const tokensAmount = tokenMap[amountValue];

    if (!tokensAmount) throw new BadRequestException('Недопустимая сумма платежа');

    let referralBonus = 0.00;
    if (user.inviter) {
      referralBonus = amountValue * 0.25;
    }

    const transaction = this.transactionRepo.create({
      amount: amountValue,
      tokens: tokensAmount,
      referralBonus: referralBonus,
      user: user,
      inviter: user.inviter || null,
      status: 'PENDING'
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
      description: `Пополнение: ${tokensAmount} токенов (Пакет ${amountValue} руб.)`,
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