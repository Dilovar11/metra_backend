import { Module } from '@nestjs/common';
import { CorrectionImageController } from './correction-image.controller';
import { CorrectionImageService } from './correction-image.service';
import { FilesModule } from 'src/Modules/file/file.module';
import { TokenBalanceModule } from 'src/Modules/token-balance/token-balance.module';

@Module({
  imports: [
    FilesModule,
    TokenBalanceModule 
  ],
  controllers: [CorrectionImageController],
  providers: [CorrectionImageService],
  exports: [CorrectionImageService], 
})
export class CorrectionImageModule {}