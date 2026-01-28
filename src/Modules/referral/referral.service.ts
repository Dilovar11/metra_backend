import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from '../../Entities/referral.entity';
import { User } from '../../Entities/user.entity';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ReferralCode } from '../../Entities/referral_codes';
import { PaymentTransaction } from '../../Entities/payment-transaction';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(ReferralCode) private codeRepo: Repository<ReferralCode>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(PaymentTransaction) private txRepo: Repository<PaymentTransaction>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }

  async getMyLink(user: User): Promise<string> {
    let refCode = await this.codeRepo.findOne({ where: { owner: { id: user.id } } });

    if (!refCode) {
      refCode = this.codeRepo.create({
        code: user.telegramId || user.id.split('-')[0], // Код на основе TG ID или части UUID
        owner: user
      });
      await this.codeRepo.save(refCode);
    }

    return `https://t.me/YourBot?start=${refCode.code}`;
  }

  // 2. Учет перехода (клик по ссылке)
  async trackClick(code: string) {
    await this.codeRepo.increment({ code }, 'clicks', 1);
  }

  // 3. Получение статистики для экрана "Партнёрская программа"
  async getReferralStats(userId: string) {
    // Количество переходов
    const codeInfo = await this.codeRepo.findOne({ where: { owner: { id: userId } } });
    const clicks = codeInfo ? codeInfo.clicks : 0;

    // Количество покупок рефералов 
    const purchasesCount = await this.txRepo.count({
      where: { inviter: { id: userId } }
    });

    // Общий доход (сумма всех referralBonus)
    const transactions = await this.txRepo.find({
      where: { inviter: { id: userId } }
    });

    const totalIncome = transactions.reduce((sum, tx) => sum + Number(tx.referralBonus), 0);

    return {
      referralLink: codeInfo ? `https://t.me/YourBot?start=${codeInfo.code}` : 'undefined',
      stats: {
        clicks: clicks,
        purchases: purchasesCount,
        income: totalIncome,
        currency: 'руб'
      }
    };
  }

  async processPayment(user: User, amount: number) {
    // Ищем, кто пригласил этого пользователя
    const referralRelation = await this.referralRepo.findOne({
      where: { invited: { id: user.id } },
      relations: ['inviter']
    });

    if (referralRelation) {
      const bonus = amount * 0.25; // Считаем 25%

      await this.txRepo.save({
        amount: amount,
        referralBonus: bonus,
        user: user,
        inviter: referralRelation.inviter
      });
    }
  }

  async create(dto: CreateReferralDto) {
    if (dto.inviterId === dto.invitedId) {
      throw new BadRequestException('Inviter and invited cannot be the same user');
    }

    const inviter = await this.userRepo.findOne({ where: { id: dto.inviterId } });
    const invited = await this.userRepo.findOne({ where: { id: dto.invitedId } });

    if (!inviter || !invited) {
      throw new NotFoundException('User not found');
    }

    const exists = await this.referralRepo.findOne({
      where: { invited: { id: invited.id } },
    });

    if (exists) {
      throw new BadRequestException('User already has an inviter');
    }

    const referral = this.referralRepo.create({
      inviter,
      invited,
    });

    return this.referralRepo.save(referral);
  }

  findAll() {
    return this.referralRepo.find({
      relations: ['inviter', 'invited'],
      order: { createdAt: 'DESC' },
    });
  }

  findByInviter(inviterId: string) {
    return this.referralRepo.find({
      where: { inviter: { id: inviterId } },
      relations: ['invited'],
    });
  }
}
