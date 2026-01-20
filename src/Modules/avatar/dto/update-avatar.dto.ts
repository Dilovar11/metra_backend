import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiPropertyOptional({
    example: 'male',
    description: 'Пол персонажа',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/front_updated.png',
    description: 'Новый URL изображения (вид спереди)',
  })
  @IsOptional()
  @IsUrl()
  imageFront?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/left_updated.png',
    description: 'Новый URL изображения (вид слева)',
  })
  @IsOptional()
  @IsUrl()
  imageLeft?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/right_updated.png',
    description: 'Новый URL изображения (вид справа)',
  })
  @IsOptional()
  @IsUrl()
  imageRight?: string;
}