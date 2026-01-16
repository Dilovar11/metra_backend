import { ApiProperty } from '@nestjs/swagger';

export class CreateAvatarDto {
  @ApiProperty({
    example: 'user-uuid-here',
    description: 'ID пользователя (User.id)',
  })
  userId: string;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.png',
    description: 'URL изображения аватара',
  })
  imageUrl: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Активен ли аватар',
  })
  isActive?: boolean;
}
