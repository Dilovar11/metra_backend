import { IsString, IsNotEmpty, IsUrl, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Используем ApiPropertyOptional
import { GenerationType } from '../../../Entities/generation.entity';

export class GenerateImageDto {
    @ApiProperty({ enum: GenerationType, description: 'Тип контента например: nano_banana' })
    @IsEnum(GenerationType)
    type: GenerationType;

    @ApiProperty({
        description: 'Текстовое описание того, что нужно сделать с изображением',
        example: 'Нарисуй кота в космосе',
    })
    @IsString()
    @IsNotEmpty({ message: 'Описание (prompt) обязательно' })
    prompt: string;

    @ApiPropertyOptional({ // Меняем на Optional для Swagger
        description: 'URL исходного изображения (необязательно)',
        example: 'https://example.com/user-photo.jpg',
        nullable: true
    })
    @IsOptional() // Позволяет полю быть отсутствующим или null
    @IsUrl({}, { message: 'Поле image должно быть корректной ссылкой' })
    image?: string; // Добавляем знак вопроса (Optional property)
}