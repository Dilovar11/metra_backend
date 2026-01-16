import { ApiProperty } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiProperty({ example: 'inviter-user-uuid' })
  inviterId: string;

  @ApiProperty({ example: 'invited-user-uuid' })
  invitedId: string;
}
