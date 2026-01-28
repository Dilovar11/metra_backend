import { ApiProperty } from '@nestjs/swagger';

export class CorrectImageDto {
  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  imageUrl: string;
}