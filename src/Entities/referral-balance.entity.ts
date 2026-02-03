// Entities/referral-balance.entity.ts
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('referral_balances')
export class ReferralBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amount: number; // Сумма бонусов в валюте (сомони)

  @UpdateDateColumn()
  updatedAt: Date;
}