import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scene } from '../../Entities/scene.entity';
import { CreateSceneDto } from './dto/create-scene.dto';

@Injectable()
export class SceneService {
  constructor(
    @InjectRepository(Scene)
    private readonly sceneRepo: Repository<Scene>,
  ) {}

  async findAll(): Promise<Scene[]> {
    return await this.sceneRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateSceneDto): Promise<Scene> {
    const newScene = this.sceneRepo.create(dto);
    return await this.sceneRepo.save(newScene);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const scene = await this.sceneRepo.findOne({ where: { id } });
    
    if (!scene) {
      throw new NotFoundException(`Сцена с ID ${id} не найдена`);
    }

    await this.sceneRepo.remove(scene);
    return { success: true };
  }
}