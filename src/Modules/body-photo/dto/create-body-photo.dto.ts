import { ApiProperty } from '@nestjs/swagger';

export class CreateBodyPhotoDto {
  @ApiProperty({ example: 'uuid-user-id' })
  userId: string;

  @ApiProperty({ example: 'https://cdn.site.com/photo.jpg' })
  imageUrl: string;
}
