import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class GenerateDto {
  @ApiProperty({
    example: 'Portrait of a cyberpunk girl',
    description: 'Prompt для генерации изображения',
  })
  @IsString()
  prompt: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Количество изображений',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  numImages?: number;
}
