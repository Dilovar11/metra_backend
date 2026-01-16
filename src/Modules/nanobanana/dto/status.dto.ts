import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StatusDto {
  @ApiProperty({
    example: '98ecae38dd2efb33a8700990e9f5dba3',
    description: 'ID задачи',
  })
  @IsString()
  taskId: string;
}
