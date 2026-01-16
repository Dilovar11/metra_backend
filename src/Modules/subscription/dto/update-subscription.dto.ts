import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
  @ApiProperty({ required: false })
  endsAt?: Date;

  @ApiProperty({ required: false })
  isActive?: boolean;
}
