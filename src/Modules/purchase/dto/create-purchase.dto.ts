import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({
    example: 'tokens',
    description: 'avatar | tokens | subscription',
  })
  type: string;

  @ApiProperty({ example: 100 })
  amount: number;
}
