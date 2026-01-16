import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 'pro_month' })
  plan: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  startsAt: Date;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  endsAt: Date;
}
