import { Module } from '@nestjs/common';
import { SceneController } from './scene.controller';
import { SceneService } from './scene.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scene } from '../../Entities/scene.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scene])], 
  controllers: [SceneController],
  providers: [SceneService],
  exports: [SceneService],
})
export class SceneModule {}