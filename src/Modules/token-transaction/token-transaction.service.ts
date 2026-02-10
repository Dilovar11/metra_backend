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

  private readonly SHOP_ID = '1272019';
  private readonly SECRET_KEY = 'test_*gZP0cwPbDpFAo6GSI4Ug31ZHaqO79Yicct7WuDgOonqc';
  constructor(


    @InjectRepository(PaymentTransaction) private transactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(TokenTransaction)
    private txRepo: Repository<TokenTransaction>,

    private tokenBalanceService: TokenBalanceService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
  }



  async createAcquiringOrder(userId: string, tokensAmount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const priceMap = { 100: 390, 300: 990, 1000: 2790, 5000: 11990 };
    const amountValue = priceMap[tokensAmount];
    if (!amountValue) throw new BadRequestException('Invalid tokens amount');

    // 1. Создаем транзакцию в БД
    const transaction = this.transactionRepo.create({
      amount: amountValue,
      user: user,
      status: 'PENDING'
    });
    await this.transactionRepo.save(transaction);

    // 2. Готовим данные для ЮKassa
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
        return_url: 'https://metra-ai.ru/profile', // Куда вернется юзер
      },
      description: `Пополнение баланса: ${tokensAmount} токенов`,
      metadata: {
        order_id: transaction.id,
      }
    };

    // 3. Делаем прямой запрос к API ЮKassa
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

      const payment = response.data;

      // 4. Сохраняем внешний ID и возвращаем ссылку
      transaction.externalId = payment.id;
      await this.transactionRepo.save(transaction);

      return {
        url: payment.confirmation.confirmation_url,
        paymentId: payment.id
      };

    } catch (error) {
      console.error('Yookassa API Error:', error.response?.data || error.message);

      throw new BadRequestException(
        error.response?.data?.description || 'Ошибка при связи с ЮKassa'
      );
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