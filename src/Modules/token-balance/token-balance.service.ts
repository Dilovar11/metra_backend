import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBalance } from '../../Entities/token-balance.entity';
import { User } from '../../Entities/user.entity';
import { CreateTokenBalanceDto } from './dto/create-token-balance.dto';
import { ReferralBalance } from 'src/Entities/referral-balance.entity';

@Injectable()
export class TokenBalanceService {
  constructor(
    @InjectRepository(TokenBalance)
    private balanceRepo: Repository<TokenBalance>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ReferralBalance)
    private refRepo: Repository<ReferralBalance>
  ) { }

  async addTokens(userId: string, tokens: number) {

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
    return this.balanceRepo.save(tokenBalance);
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
