import { Module } from '@nestjs/common';
import { SceneController } from './scene.controller';
import { SceneService } from './scene.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scene } from '../../Entities/scene.entity';
import { FilesModule } from '../file/file.module';
import { SceneCategory } from 'src/Entities/scene-category.entity';
import { SceneCategoryService } from './scene-category.service';
import { SceneCategoryController } from './scenecategory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Scene, SceneCategory]), FilesModule], 
  controllers: [SceneController, SceneCategoryController],
  providers: [SceneService, SceneCategoryService],
  exports: [SceneService],
})
export class SceneModule {}