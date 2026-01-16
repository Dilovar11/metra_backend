import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenBalanceDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 100, required: false })
  balance?: number;
}
