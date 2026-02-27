import { Module } from '@nestjs/common';
import { ImageGeneratorController } from './image-generator.controller';
import { ImageGeneratorService } from './image-generator.service';
import { FilesModule } from '../../Modules/file/file.module';

@Module({
    imports: [FilesModule],
    controllers: [ImageGeneratorController],
    providers: [ImageGeneratorService]
})
export class ImageGeneratorModule {}