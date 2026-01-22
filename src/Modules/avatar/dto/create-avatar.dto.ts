import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateAvatarDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'My Super Avatar', description: 'Имя аватара' })
  @IsString()
  @IsNotEmpty()
  name: string; 

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 'https://cdn.example.com/front.png' })
  @IsUrl()
  imagesURL: string[];
}