import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsDateString } from 'class-validator';

export enum SubscriptionPlan {
  BASIC = 'Metra Basic',
  PRO = 'Metra Pro',
  MAX = 'Metra Max',
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'user-uuid', description: 'ID пользователя' })
  @IsString()
  userId: string;

  @ApiProperty({ 
    example: SubscriptionPlan.PRO, 
    enum: SubscriptionPlan, 
    description: 'Название тарифного плана' 
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ example: '2026-02-12T16:00:00.000Z', description: 'Дата начала подписки' })
  @IsDateString()
  startsAt: Date;

  @ApiProperty({ example: '2026-03-12T16:00:00.000Z', description: 'Дата окончания подписки' })
  @IsDateString()
  endsAt: Date;
}
