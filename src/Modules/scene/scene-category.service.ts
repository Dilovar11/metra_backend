import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneCategory } from 'src/Entities/scene-category.entity';
import { CreateSceneCategoryDto } from './dto/create-scene-category.dto';
import { FilesService } from '../file/file.service';

@Injectable()
export class SceneCategoryService {
    constructor(
        @InjectRepository(SceneCategory)
        private readonly categoryRepo: Repository<SceneCategory>,
        private fileService: FilesService
    ) { }

    async findAll(): Promise<SceneCategory[]> {
        return await this.categoryRepo.find({
            order: { id: 'ASC' }
        });
    }

    async create(dto: CreateSceneCategoryDto, file: Express.Multer.File): Promise<SceneCategory> {

        const fileName = `${Date.now()}-${dto.name.replace(/\s+/g, '_')}`;

        const uploadResults = await this.fileService.saveFileSceneCategory([file], fileName);

        const imageUrl = uploadResults[0].url;

        const category = this.categoryRepo.create({
            ...dto,
            image: imageUrl, 
        });

        // 5. Сохраняем в БД
        return await this.categoryRepo.save(category);
    }

    async remove(id: number): Promise<{ success: boolean }> {
        const category = await this.categoryRepo.findOne({ where: { id } });

        if (!category) {
            throw new NotFoundException(`Категория с ID ${id} не найдена`);
        }

        await this.categoryRepo.remove(category);
        return { success: true };
    }
}