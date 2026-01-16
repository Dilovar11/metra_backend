import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationMedia } from '../../Entities/generation-media.entity';
import { Generation } from '../../Entities/generation.entity';
import { GenerationMediaService } from './generation-media.service';
import { GenerationMediaController } from './generation-media.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GenerationMedia, Generation])],
  providers: [GenerationMediaService],
  controllers: [GenerationMediaController],
})
export class GenerationMediaModule {}
