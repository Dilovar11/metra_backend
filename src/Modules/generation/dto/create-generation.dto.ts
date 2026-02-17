import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsNotEmpty, IsUrl } from 'class-validator';
import { GenerationType } from '../../../Entities/generation.entity';

export class CreateGenerationDto {
  @ApiProperty({ description: 'ID задачи во внешней системе' })
  @IsString()
  externalTaskId: string;

  @ApiProperty({ enum: GenerationType, description: 'Тип контента например: nano_banana' })
  @IsEnum(GenerationType)
  type: GenerationType;

  @ApiProperty({ required: false, description: 'Текстовый промпт' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({
    description: 'URL генерированного изображения',
    example: 'https://example.com/user-photo.jpg',
  })
  @IsString()
  @IsNotEmpty({ message: 'Генерированное изображение обязательно' })
  @IsUrl({}, { message: 'Поле image должно быть корректной ссылкой' })
  imageURL: string;
}