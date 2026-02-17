import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsUrl, IsArray, ArrayMinSize } from 'class-validator';

export class CreateAvatarDto {

  @ApiProperty({ example: 'My Super Avatar', description: 'Имя аватара' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: [
      'https://cdn.example.com/front.png',
      'https://cdn.example.com/left.png',
      'https://cdn.example.com/right.png'
    ],
    description: 'Массив ссылок на исходные изображения',
    type: [String] 
  })
  @IsArray({ message: 'imagesURL должен быть массивом' })
  @ArrayMinSize(1, { message: 'Должна быть хотя бы одна ссылка на изображение' })
  @IsUrl({}, {
    each: true,
    message: 'Каждый элемент в массиве должен быть корректной ссылкой'
  })
  imagesURL: string[];
}