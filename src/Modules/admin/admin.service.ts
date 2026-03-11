import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { User } from '../../Entities/user.entity';
import { Generation } from '../../Entities/generation.entity';
import { Scene } from '../../Entities/scene.entity';
import { PaymentTransaction } from '../../Entities/payment-transaction';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Generation) private genRepo: Repository<Generation>,
    @InjectRepository(Scene) private sceneRepo: Repository<Scene>,
    @InjectRepository(PaymentTransaction) private transRepo: Repository<PaymentTransaction>,
  ) {}

  async getStats() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Всего пользователей
    const totalUsers = await this.userRepo.count();

    // 2. Новых за 24 часа
    const newUsers24h = await this.userRepo.count({
      where: { createdAt: MoreThan(dayAgo) },
    });

    // 3. Всего генераций
    const totalGenerations = await this.genRepo.count();

    // 4. Всего сцен
    const totalScenes = await this.sceneRepo.count();

    // 5. Выручка и количество покупок (учитываем только статус SUCCESS/PAID)
    const transactions = await this.transRepo.find({
      where: { status: 'SUCCESS' }, 
    });

    const revenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const purchasesCount = transactions.length;

    return {
      totalUsers,
      newUsers24h,
      totalGenerations,
      totalScenes,
      revenue: parseFloat(revenue.toFixed(2)),
      purchasesCount,
    };
  }
}