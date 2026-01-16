import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Generation } from 'src/Entities/generation.entity';
import { GenerationMedia } from 'src/Entities/generation-media.entity';
import { User } from 'src/Entities/user.entity';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Generation, GenerationMedia, User])],
  providers: [GenerationService],
  controllers: [GenerationController],
})
export class GenerationModule {}
