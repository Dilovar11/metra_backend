import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../../../Entities/generation-media.entity';

export class CreateGenerationMediaDto {
  @ApiProperty({ example: 'uuid-generation-id' })
  generationId: string;

  @ApiProperty({ example: 'https://cdn.site.com/media.jpg' })
  mediaUrl: string;

  @ApiProperty({
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  mediaType: MediaType;
}
