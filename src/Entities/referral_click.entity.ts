import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Unique } from "typeorm";
import { ReferralCode } from "./referral_codes";

@Entity('referral_clicks')
@Unique(['telegramId', 'referralCode']) // Защита: один и тот же "след" не накрутит один и тот же код
export class ReferralClick {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telegramId: string; // Сюда пишем telegramId или IP

  @ManyToOne(() => ReferralCode, { onDelete: 'CASCADE' })
  referralCode: ReferralCode;

  @CreateDateColumn()
  createdAt: Date;
}