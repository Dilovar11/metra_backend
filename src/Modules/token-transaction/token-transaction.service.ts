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
    this.checkout = new YooKassa.YooCheckout({
      shopId: '513616',
      secretKey: 'test_*gZP0cwPbDpFAo6GSI4Ug31ZHaqO79Yicct7WuDgOonqc',
    });
  }



  async createAcquiringOrder(userId: string, tokensAmount: number) {
    // 1. Поиск пользователя
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['inviter'] });
    if (!user) throw new NotFoundException('User not found');

    // 2. Определение стоимости
    const priceMap = { 100: 390, 300: 990, 1000: 2790, 5000: 11990 };
    const amount = priceMap[tokensAmount];
    if (!amount) throw new BadRequestException('Invalid tokens amount');

    // 3. Создаем запись транзакции в нашей базе данных
    const transaction = this.transactionRepo.create({
      amount: amount,
      referralBonus: amount * 0.25,
      user: user,
      inviter: user.inviter,
      status: 'PENDING'
    });
    await this.transactionRepo.save(transaction);


    const createPayload: ICreatePayment = {
      amount: {
        value: amount.toFixed(2), // ЮKassa требует формат "100.00"
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: 'https://ваш-сайт.ru/profile',
      },
      description: `Пополнение баланса: ${tokensAmount} токенов`,
      metadata: {
        order_id: transaction.id, // ID из нашей базы для обработки вебхука
        userId: user.id
      }
    };

    const idempotencyKey = uuidv4();

    try {
      // 5. Запрос к API ЮKassa
      const payment = await this.checkout.createPayment(createPayload, idempotencyKey);

      // 6. Сохраняем ID платежа от ЮKassa (например: 2b34...-000f)
      transaction.externalId = payment.id;
      await this.transactionRepo.save(transaction);

      // 7. Возвращаем ссылку на страницу оплаты
      return {
        url: payment.confirmation.confirmation_url,
        paymentId: payment.id
      };
    } catch (error) {
      console.error('Ошибка ЮKassa:', error);
      throw new BadRequestException('Не удалось инициировать платеж');
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