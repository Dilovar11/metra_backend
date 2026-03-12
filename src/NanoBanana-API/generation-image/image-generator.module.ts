import { Module } from '@nestjs/common';
import { ImageGeneratorController } from './image-generator.controller';
import { ImageGeneratorService } from './image-generator.service';
import { FilesModule } from '../../Modules/file/file.module';
import { VideoGeneratorService } from './video-generator.service';
import { TokenBalanceModule } from '../../Modules/token-balance/token-balance.module';

@Module({
    imports: [FilesModule, TokenBalanceModule],
    controllers: [ImageGeneratorController],
    providers: [ImageGeneratorService, VideoGeneratorService]
})
export class ImageGeneratorModule {}