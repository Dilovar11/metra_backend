import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Generation } from '../../Entities/generation.entity';
import { GenerationMedia } from '../../Entities/generation-media.entity';
import { User } from '../../Entities/user.entity';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Generation, GenerationMedia, User])],
  providers: [GenerationService],
  controllers: [GenerationController],
})
export class GenerationModule {}
