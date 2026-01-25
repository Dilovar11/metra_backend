import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiPropertyOptional({
    example: 'New Avatar Name',
    description: 'Имя аватара',
  })
  @IsOptional() 
  @IsString()
  name?: string; 

  @ApiPropertyOptional({
    example: 'female',
    description: 'Пол персонажа',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/front_updated.png',
    description: 'Новый URL изображения',
  })
  @IsOptional()
  @IsUrl()
  imagesURL: string[];
}