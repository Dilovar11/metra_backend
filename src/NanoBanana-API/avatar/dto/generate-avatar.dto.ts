// src/avatar/dto/generate-avatar.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsEnum, IsOptional } from 'class-validator';

// Если у вас есть enum для пола
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class GenerateAvatarDto {
  @ApiProperty({
    example: 'female',
    description: 'Пол персонажа для генерации. Используется для доработки аватара.',
    enum: Gender, 
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: 'https://existing.com/front.png',
    description: 'URL изображения аватара (вид спереди)',
  })
  @IsUrl()
  imageFront: string;

  @ApiProperty({
    example: 'https://existing.com/left.png',
    description: 'URL изображения аватара (вид слева)',
  })
  @IsUrl()
  imageLeft: string;

  @ApiProperty({
    example: 'https://existing.com/right.png',
    description: 'URL изображения аватара (вид справа)',
  })
  @IsUrl()
  imageRight: string;

  @ApiProperty({
    example: 'Add a hat and glasses',
    description: 'Дополнительный промпт для изменения/улучшения аватара',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalPrompt?: string;
}