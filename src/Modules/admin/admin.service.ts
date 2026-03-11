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
    ) { }

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

    async getPartnerStats() {
        try {
            // 1. Считаем бонусы через QueryBuilder (более эффективно)
            // Убедись, что 'SUCCESS' — это именно тот статус, который ты записываешь в БД
            const bonusResult = await this.transRepo
                .createQueryBuilder('t')
                .select('SUM(CAST(t.referralBonus AS DECIMAL))', 'total')
                .where('t.status = :status', { status: 'SUCCESS' })
                .getRawOne();

            const totalReferralPaid = parseFloat(bonusResult.total || 0);

            // 2. Топ рефералов (исправленный запрос)
            const topReferrals = await this.userRepo
                .createQueryBuilder('user')
                .leftJoin('user.referrals', 'referral') // Используем связь, описанную в Entity
                .select([
                    'user.id AS id',
                    'user.username AS username',
                    'user.firstName AS firstName'
                ])
                .addSelect('COUNT(referral.id)', 'referralsCount')
                .groupBy('user.id')
                .having('COUNT(referral.id) > 0') // Только те, у кого есть хоть один реферал
                .orderBy('"referralsCount"', 'DESC') // Кавычки нужны для PostgreSQL, чтобы найти alias
                .limit(5)
                .getRawMany();

            return {
                totalReferralPaid: parseFloat(totalReferralPaid.toFixed(2)),
                topReferrals: topReferrals.map(r => ({
                    username: r.username,
                    firstName: r.firstName,
                    referralsCount: parseInt(r.referralsCount, 10)
                }))
            };
        } catch (error) {
            console.error('Partner Stats Error:', error);
            throw error;
        }
    }
}