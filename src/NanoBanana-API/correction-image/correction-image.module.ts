import { Module } from '@nestjs/common';
import { CorrectionImageController } from './correction-image.controller';
import { CorrectionImageService } from './correction-image.service';

@Module({
  controllers: [CorrectionImageController],
  providers: [CorrectionImageService],
  exports: [CorrectionImageService], 
})
export class CorrectionImageModule {}