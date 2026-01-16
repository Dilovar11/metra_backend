import { ApiProperty } from '@nestjs/swagger';

export class UpdateGenerationStatusDto {
  @ApiProperty({ enum: ['pending', 'processing', 'done', 'failed'] })
  status: 'pending' | 'processing' | 'done' | 'failed';

  @ApiProperty({ required: false })
  externalTaskId?: string;
}
