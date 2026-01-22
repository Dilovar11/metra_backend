import { IsString, IsNotEmpty, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenerationType } from '../../../Entities/generation.entity';

export class GenerateImageDto {
    @ApiProperty({ enum: GenerationType, description: 'Тип контента например: nano_banana' })
    @IsEnum(GenerationType)
    type: GenerationType;

    @ApiProperty({
        description: 'Текстовое описание того, что нужно сделать с изображением',
        example: 'Преврати это фото в персонажа аниме',
    })
    @IsString()
    @IsNotEmpty({ message: 'Описание (prompt) обязательно' })
    prompt: string;

    @ApiProperty({
        description: 'URL исходного изображения для обработки',
        example: 'https://example.com/user-photo.jpg',
    })
    @IsString()
    @IsNotEmpty({ message: 'Фото обязательно для обработки' })
    @IsUrl({}, { message: 'Поле image должно быть корректной ссылкой' })
    image: string;
}