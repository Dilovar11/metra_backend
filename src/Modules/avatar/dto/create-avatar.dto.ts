import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateAvatarDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID пользователя, к которому привязан аватар',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: 'male',
    description: 'Пол персонажа',
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: 'https://cdn.example.com/front.png',
    description: 'URL изображения (вид спереди)',
  })
  @IsUrl()
  imageFront: string;

  @ApiProperty({
    example: 'https://cdn.example.com/left.png',
    description: 'URL изображения (вид слева)',
  })
  @IsUrl()
  imageLeft: string;

  @ApiProperty({
    example: 'https://cdn.example.com/right.png',
    description: 'URL изображения (вид справа)',
  })
  @IsUrl()
  imageRight: string;
}