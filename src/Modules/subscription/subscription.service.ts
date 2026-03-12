import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../Entities/subscription.entity';
import { User } from '../../Entities/user.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';


@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subRepo: Repository<Subscription>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

  ) { }

  async create(userId: string, dto: CreateSubscriptionDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // отключаем активные подписки
    await this.subRepo.update(
      { user: { id: user.id }, isActive: true },
      { isActive: false },
    );

    const subscription = this.subRepo.create({
      user,
      plan: dto.plan,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      isActive: true,
    });

    return this.subRepo.save(subscription);
  }

  findAll() {
    return this.subRepo.find({
      relations: ['user'],
      order: { startsAt: 'DESC' },
    });
  }

  findByUser(userId: string) {
    return this.subRepo.find({
      where: { user: { id: userId } },
      order: { startsAt: 'DESC' },
    });
  }

  async deactivate(id: string) {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');

    sub.isActive = false;
    return this.subRepo.save(sub);
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');

    Object.assign(sub, dto);
    return this.subRepo.save(sub);
  }

  @Cron(CronExpression.EVERY_30_MINUTES) // Будет проверять каждый час
  async handleExpiredSubscriptions() {
    console.log('[Cron] Проверка просроченных подписок...');

    const result = await this.subRepo.update(
      {
        isActive: true,
        endsAt: LessThan(new Date()), // Те, у кого дата окончания меньше текущей
      },
      {
        isActive: false,
      }
    );

    if (result.affected! > 0) {
      console.log(`[Cron] Отключено просроченных подписок: ${result.affected}`);
    }
  }
}
