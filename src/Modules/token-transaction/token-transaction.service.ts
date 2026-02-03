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

@Injectable()
export class TokenTransactionService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(PaymentTransaction) private transactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(TokenTransaction)
    private txRepo: Repository<TokenTransaction>,

    private tokenBalanceService: TokenBalanceService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  // МЕТОД С ЭМУЛЯЦИЕЙ
  async createAcquiringOrder(userId: string, tokensAmount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['inviter'] });
    if (!user) throw new NotFoundException('User not found');

    const priceMap = { 100: 390, 300: 990, 1000: 2790, 5000: 11990 };
    const amount = priceMap[tokensAmount];
    if (!amount) throw new BadRequestException('Invalid tokens amount');

    const transaction = this.transactionRepo.create({
      amount: amount,
      referralBonus: amount * 0.25,
      user: user,
      inviter: user.inviter,
      status: 'PENDING'
    });
    await this.transactionRepo.save(transaction);

    // Локальный URL для эмуляции (измените порт, если у вас не 3000)
    const fakeBankUrl = 'http://localhost:3000/payments/fake-bank-page';

    return {
      message: "Redirecting to Fake Bank",
      url: fakeBankUrl,
      params: {
        order_id: transaction.id,
        amount: amount,
        merch_id: "FAKE_MERCHANT_123"
      }
    };
  }


  async handleCallback(data: any) {
    const { order_id, status, bank_id } = data;

    const transaction = await this.transactionRepo.findOne({
      where: { id: order_id },
      relations: ['user', 'inviter']
    });

    if (transaction && status === 'SUCCESS' && transaction.status === 'PENDING') {
      transaction.status = 'SUCCESS';
      transaction.externalId = bank_id;
      await this.transactionRepo.save(transaction);

      // Логика определения количества токенов по сумме (если не добавляли поле в БД)
      const amountToTokens = {
        '390.00': 100,
        '990.00': 300,
        '2790.00': 1000,
        '11990.00': 5000
      };

      // Преобразуем decimal из БД в строку для поиска в мапе
      const purchasedTokens = amountToTokens[String(transaction.amount)] || 0;

      // 1. Начисляем токены пользователю
      if (purchasedTokens > 0) {
        await this.tokenBalanceService.addTokens(transaction.user.id, purchasedTokens);
      }

      // 2. Начисляем бонус пригласителю (25% от суммы в сомони или токенах, как у вас задумано)
      if (transaction.inviter && transaction.referralBonus > 0) {
        // Здесь логика начисления бонуса пригласившему
        await this.tokenBalanceService.addBonus(transaction.inviter.id, transaction.referralBonus);
      }
    }
  }

  async create(dto: CreateTokenTransactionDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: dto.userId },
      });
      if (!user) throw new NotFoundException('User not found');

      const balance = await manager.findOne(TokenBalance, {
        where: { user: { id: user.id } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!balance) throw new NotFoundException('Token balance not found');

      const newBalance = balance.balance + dto.amount;
      if (newBalance < 0) {
        throw new BadRequestException('Insufficient tokens');
      }

      balance.balance = newBalance;
      await manager.save(balance);

      const tx = manager.create(TokenTransaction, {
        user,
        amount: dto.amount,
        reason: dto.reason,
      });

      return manager.save(tx);
    });
  }

  findAll() {
    return this.txRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  findByUser(userId: string) {
    return this.txRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
