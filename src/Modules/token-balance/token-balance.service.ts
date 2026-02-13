import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { CreateTokenBalanceDto } from './dto/create-token-balance.dto';
import { ReferralBalance } from '../../Entities/referral-balance.entity';
import { TokenTransaction } from '../../Entities/token-transaction.entity';

@Injectable()
export class TokenBalanceService {
  constructor(
    @InjectRepository(TokenBalance)
    private balanceRepo: Repository<TokenBalance>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ReferralBalance) 
    private refRepo: Repository<ReferralBalance>,

    @InjectRepository(TokenTransaction) private transactionRepo: Repository<TokenTransaction>,
  ) { }


  async addTokens(userId: string, tokens: number, reason: string = 'Пополнение токена') {
    let tokenBalance = await this.balanceRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!tokenBalance) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Пользователь не найден');

      tokenBalance = this.balanceRepo.create({
        user: user,
        balance: tokens,
      });
    } else {
      tokenBalance.balance = Number(tokenBalance.balance) + tokens;
    }

    const savedBalance = await this.balanceRepo.save(tokenBalance);

    await this.transactionRepo.save({
      user: { id: userId },
      amount: tokens,
      reason: reason,
    });

    return savedBalance;
  }


  async addBonus(userId: string, bonusAmount: number) {
    let balance = await this.refRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!balance) {
      balance = this.refRepo.create({
        user: { id: userId } as any,
        amount: bonusAmount,
      });
    } else {
      balance.amount = Number(balance.amount) + Number(bonusAmount);
    }

    return this.refRepo.save(balance);
  }


  async subtractTokens(userId: string, tokens: number, reason: string = 'Списание токенов') {
    const tokenBalance = await this.balanceRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!tokenBalance) {
      throw new NotFoundException('Баланс не найден');
    }

    const currentBalance = Number(tokenBalance.balance);
    if (currentBalance < tokens) {
      throw new BadRequestException('Недостаточно токенов');
    }

    tokenBalance.balance = currentBalance - tokens;
    const savedBalance = await this.balanceRepo.save(tokenBalance);

    await this.transactionRepo.save({
      user: { id: userId },
      amount: -tokens,
      reason: reason,
    });

    return savedBalance;
  }

  async create(dto: CreateTokenBalanceDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const exists = await this.balanceRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (exists) {
      throw new BadRequestException('Token balance already exists');
    }

    const balance = this.balanceRepo.create({
      user,
      balance: dto.balance ?? 0,
    });

    return this.balanceRepo.save(balance);
  }

  findAll() {
    return this.balanceRepo.find({
      relations: ['user'],
    });
  }

  async findByUser(userId: string) {
    const balance = await this.balanceRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!balance) throw new NotFoundException('Balance not found');
    return balance;
  }
}
