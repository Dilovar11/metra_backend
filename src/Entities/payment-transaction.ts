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
  amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  referralBonus: number; // Те самые 25% (amount * 0.25)

  @Column({ default: 'PENDING' })
  status: string; 

  @Column({ nullable: true })
  externalId: string;

  @ManyToOne(() => User)
  user: User; 

  @ManyToOne(() => User)
  inviter: User; 

  @CreateDateColumn()
  createdAt: Date;
}