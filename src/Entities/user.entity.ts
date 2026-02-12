import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ example: 'uuid', description: 'ID пользователя' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123456789', description: 'Telegram ID пользователя' })
  @Column({ unique: true })
  telegramId: string;

  @ApiProperty({ example: 'johndoe', required: false })
  @Column({ nullable: true })
  username: string;

  @ApiProperty({ example: 'John', required: false })
  @Column({ nullable: true })
  firstName: string;

  @ApiProperty({ example: 'Doe', required: false })
  @Column({ nullable: true })
  lastName: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isBlocked: boolean;

  // Тот, кто пригласил этого пользователя
  @ManyToOne(() => User, (user) => user.referrals, { nullable: true })
  @JoinColumn({ name: 'inviterId' })
  inviter: User;

  // Список людей, которых пригласил этот пользователь 
  @OneToMany(() => User, (user) => user.inviter)
  referrals: User[];

  @ApiProperty({ example: '2026-01-05T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}
