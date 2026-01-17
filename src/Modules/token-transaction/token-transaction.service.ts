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

@Injectable()
export class TokenTransactionService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(TokenTransaction)
    private txRepo: Repository<TokenTransaction>,

    @InjectRepository(TokenBalance)
    private balanceRepo: Repository<TokenBalance>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

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
