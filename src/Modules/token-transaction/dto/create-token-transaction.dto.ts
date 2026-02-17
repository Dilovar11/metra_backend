import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenTransactionDto {
  @ApiProperty({
    example: -10,
    description: 'Отрицательное — списание, положительное — начисление',
  })
  amount: number;

  @ApiProperty({
    example: 'generation_nano_banana',
  })
  reason: string;
}
