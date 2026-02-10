import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TokenTransaction } from '../../Entities/token-transaction.entity';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { CreateTokenTransactionDto } from './dto/create-token-transaction.dto';
import { PaymentTransaction } from '../../Entities/payment-transaction';
import { TokenBalanceService } from '../token-balance/token-balance.service';
const YooKassa = require('yookassa');
import { v4 as uuidv4 } from 'uuid'; // для ключа идемпотентности
import axios from 'axios';

interface ICreatePayment {
  amount: {
    value: string;
    currency: string;
  };
  payment_method_data?: {
    type: string;
  };
  confirmation: {
    type: 'redirect';
    return_url: string;
  };
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TokenTransactionService {

  private checkout: any;

  constructor(
    private dataSource: DataSource,


    @InjectRepository(PaymentTransaction) private transactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(TokenTransaction)
    private txRepo: Repository<TokenTransaction>,

    private tokenBalanceService: TokenBalanceService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    try {
      // Пытаемся инициализировать через разные варианты экспорта
      const CheckoutClass = YooKassa.YooCheckout || (YooKassa.default && YooKassa.default.YooCheckout);

      if (!CheckoutClass) {
        throw new Error('Could not find YooCheckout constructor in yookassa module');
      }
      this.checkout = new YooKassa.YooCheckout({
        shopId: '1272019',
        secretKey: 'test_ZuHKwKoGiARiU9TNoKNpQ2R5BmTCQ3vyYRZ5wZvvSnU',
      });
    } catch (e) {
      console.error('Yookassa Init Error:', e.message);
    }
  }



  async createAcquiringOrder(userId: string, tokensAmount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['inviter'] });
    if (!user) throw new NotFoundException('User not found');

    const priceMap = { 100: 390, 300: 990, 1000: 2790, 5000: 11990 };
    const amountValue = priceMap[tokensAmount];
    if (!amountValue) throw new BadRequestException('Invalid tokens amount');

    // Сначала сохраняем в свою БД
    const transaction = this.transactionRepo.create({
      amount: amountValue,
      referralBonus: amountValue * 0.25,
      user: user,
      inviter: user.inviter,
      status: 'PENDING'
    });
    await this.transactionRepo.save(transaction);

    // Подготовка объекта строго по документации
    const createPayload = {
      amount: {
        value: amountValue.toFixed(2), // "390.00" - строго строка с двумя знаками
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://www.google.com', // Заглушка для теста
      },
      description: "Оплата заказа",
      metadata: {
        order_id: String(transaction.id), // ЮKassa любит строки в метаданных
      }
    };

    const idempotencyKey = uuidv4();

    try {
      // Используем метод createPayment
      const payment = await this.checkout.createPayment(createPayload, idempotencyKey);

      transaction.externalId = payment.id;
      await this.transactionRepo.save(transaction);

      return {
        url: payment.confirmation.confirmation_url,
        paymentId: payment.id
      };
    } catch (error) {
      // Если снова 400, этот лог покажет КТО виноват
      console.error('Детали ошибки ЮKassa:', error.response?.data || error.message);

      throw new BadRequestException({
        message: 'ЮKassa отклонила запрос',
        details: error.response?.data?.description || 'Неверные параметры платежа'
      });
    }
  }


  async handleWebhook(data: any) {
    // ЮKassa присылает событие payment.succeeded
    if (data.event !== 'payment.succeeded') return;

    const payment = data.object;
    const orderId = payment.metadata.order_id;

    const transaction = await this.transactionRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'inviter']
    });

    if (transaction && transaction.status === 'PENDING') {
      transaction.status = 'SUCCESS';
      await this.transactionRepo.save(transaction);

      // Логика начисления токенов (как у вас и была)
      const amountToTokens = { '390.00': 100, '990.00': 300, '2790.00': 1000, '11990.00': 5000 };
      const purchasedTokens = amountToTokens[String(transaction.amount)] || 0;

      if (purchasedTokens > 0) {
        await this.tokenBalanceService.addTokens(transaction.user.id, purchasedTokens);
      }

      if (transaction.inviter) {
        await this.tokenBalanceService.addBonus(transaction.inviter.id, transaction.referralBonus);
      }
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