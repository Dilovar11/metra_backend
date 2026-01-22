import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsNotEmpty, IsUrl } from 'class-validator';
import { GenerationType } from '../../../Entities/generation.entity';

export class CreateGenerationDto {
  @ApiProperty({ description: 'ID задачи во внешней системе' })
  @IsString()
  externalTaskId: string;

  @ApiProperty({ enum: GenerationType, description: 'Тип контента' })
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

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID владельца' })
  @IsUUID()
  userId: string;
}