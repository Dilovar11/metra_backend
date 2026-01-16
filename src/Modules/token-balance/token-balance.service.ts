import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBalance } from 'src/Entities/token-balance.entity';
import { User } from 'src/Entities/user.entity';
import { CreateTokenBalanceDto } from './dto/create-token-balance.dto';

@Injectable()
export class TokenBalanceService {
  constructor(
    @InjectRepository(TokenBalance)
    private balanceRepo: Repository<TokenBalance>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

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
