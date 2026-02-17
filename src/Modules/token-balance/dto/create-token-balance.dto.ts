import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenBalanceDto {
  @ApiProperty({ example: 100, required: false })
  balance?: number;
}
