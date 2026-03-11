import { Module } from '@nestjs/common';
import { ImageGeneratorController } from './image-generator.controller';
import { ImageGeneratorService } from './image-generator.service';
import { FilesModule } from '../../Modules/file/file.module';
import { VideoGeneratorService } from './video-generator.service';

@Module({
    imports: [FilesModule],
    controllers: [ImageGeneratorController],
    providers: [ImageGeneratorService, VideoGeneratorService]
})
export class ImageGeneratorModule {}