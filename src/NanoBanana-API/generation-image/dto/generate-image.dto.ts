import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateImageDto {

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