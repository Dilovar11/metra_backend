import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from '../../Entities/purchase.entity';
import { User } from '../../Entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreatePurchaseDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const purchase = this.purchaseRepo.create({
      user,
      type: dto.type,
      amount: dto.amount,
    });

    return this.purchaseRepo.save(purchase);
  }

  findAll() {
    return this.purchaseRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  findByUser(userId: string) {
    return this.purchaseRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
