import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsEnum } from 'class-validator';

// Если у вас есть enum для пола
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class GenerateAvatarDto {

  @ApiProperty({ example: 'My Super Avatar', description: 'Имя аватара' })
  @IsString()
  @IsNotEmpty()
  name: string; 

  @ApiProperty({
    example: 'female',
    description: 'Пол персонажа для генерации',
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
}