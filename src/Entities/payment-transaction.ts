import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // Сумма пополнения

  @Column('decimal', { precision: 10, scale: 2 })
  referralBonus: number; // Те самые 25% (amount * 0.25)

  @ManyToOne(() => User)
  user: User; // Кто совершил покупку (реферал)

  @ManyToOne(() => User)
  inviter: User; // Кому начислен бонус

  @CreateDateColumn()
  createdAt: Date;
}