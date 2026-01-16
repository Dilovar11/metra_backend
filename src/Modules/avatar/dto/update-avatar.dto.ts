import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar_new.png',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    example: false,
  })
  isActive?: boolean;
}
