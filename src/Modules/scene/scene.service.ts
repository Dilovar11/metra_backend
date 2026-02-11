import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scene, SceneMode, SceneType } from '../../Entities/scene.entity';
import { CreateSceneDto } from './dto/create-scene.dto';
import { FilesService } from '../file/file.service';

@Injectable()
export class SceneService {
    constructor(
        @InjectRepository(Scene)
        private readonly sceneRepo: Repository<Scene>,
        private fileService: FilesService
    ) { }

    async findAll(mode?: SceneMode, type?: SceneType) {
        const where: any = {};

        if (mode) where.mode = mode;
        if (type) where.type = type;

        return this.sceneRepo.find({ where });
    }

    async create(dto: CreateSceneDto, file: Express.Multer.File): Promise<Scene> {
        if (!file) {
            throw new BadRequestException('Изображение обязательно для загрузки');
        }
        const fileName = `${Date.now()}_${dto.name.replace(/\s+/g, '_')}`;
        const savedFiles = await this.fileService.saveFileScene([file], fileName);
        const imageUrl = savedFiles[0].url;
        const newScene = this.sceneRepo.create({
            ...dto,
            image: imageUrl, 
        });

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