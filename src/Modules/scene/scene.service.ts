import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scene, SceneMode } from '../../Entities/scene.entity';
import { SceneCategory } from '../../Entities/scene-category.entity'; // Импортируйте новую сущность
import { CreateSceneDto } from './dto/create-scene.dto';
import { FilesService } from '../file/file.service';

@Injectable()
export class SceneService {
    constructor(
        @InjectRepository(Scene)
        private readonly sceneRepo: Repository<Scene>,

        @InjectRepository(SceneCategory) // Добавляем репозиторий категорий
        private readonly categoryRepo: Repository<SceneCategory>,

        private fileService: FilesService
    ) { }

    async findAll(mode?: SceneMode, categoryId?: number) {
        const where: any = {};

        if (mode) where.mode = mode;
        // Фильтрация по связанной сущности через ID
        if (categoryId) where.category = { id: categoryId };

        return this.sceneRepo.find({
            where,
            relations: ['category'] 
        });
    }

    async findOneById(id: number) {
        return this.sceneRepo.findOne({
            where: { id },
            relations: ['category'] 
        });
    }

    async create(dto: CreateSceneDto, file: Express.Multer.File): Promise<Scene> {
        if (!file) {
            throw new BadRequestException('Изображение обязательно для загрузки');
        }

        // 1. Ищем категорию в базе данных
        const category = await this.categoryRepo.findOne({
            where: { id: dto.categoryId }
        });

        if (!category) {
            throw new NotFoundException(`Категория с ID ${dto.categoryId} не найдена`);
        }

        // 2. Загружаем файл в Cloudinary
        const fileName = `${Date.now()}_${dto.name.replace(/\s+/g, '_')}`;
        const savedFiles = await this.fileService.saveFileScene([file], fileName);
        const imageUrl = savedFiles[0].url;

        // 3. Создаем сцену
        const newScene = this.sceneRepo.create({
            mode: dto.mode,
            name: dto.name,
            prompt: dto.prompt,
            image: imageUrl,
            category: category, // Привязываем объект категории
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