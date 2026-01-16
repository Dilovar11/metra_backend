import { ApiProperty } from '@nestjs/swagger';
import { GenerationType } from 'src/Entities/generation.entity';

export class CreateGenerationDto {
  @ApiProperty({ enum: GenerationType })
  type: GenerationType;

  @ApiProperty({ required: false })
  prompt?: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;
}
