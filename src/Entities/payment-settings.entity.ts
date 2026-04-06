import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_settings')
export class PaymentSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 3.9 })
  tokenPriceRub: number; // Цена 1 токена в рублях (например, 3.90)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.1 })
  tokenPriceStars: number; // Цена 1 токена в звездах (например, 0.1)

  @UpdateDateColumn()
  updatedAt: Date;
}