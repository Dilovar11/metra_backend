import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SceneService } from './scene.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { SceneMode } from '../../Entities/scene.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../Common/decorators/public.decorator';

@Public()
@ApiTags('Scenes (Сцены)')
@Controller('scenes')
export class SceneController {
    constructor(private readonly sceneService: SceneService) { }

    @Get()
    @ApiOperation({ summary: 'Получить список всех сцен с фильтрацией' })
    @ApiQuery({
        name: 'mode',
        enum: SceneMode,
        required: false,
        description: 'Фильтр по режиму (Template или FreeStyle)'
    })
    @ApiQuery({
        name: 'categoryId',
        type: Number,
        required: false,
        description: 'ID категории из таблицы scene_categories'
    })
    findAll(
        @Query('mode') mode?: SceneMode,
        @Query('categoryId') categoryId?: number, // Теперь фильтруем по ID
    ) {
        return this.sceneService.findAll(mode, categoryId);
    }

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    @ApiOperation({
        summary: 'Создать новую сцену',
        description: 'Метод принимает данные сцены и файл изображения, загружает его в облако и сохраняет запись в БД.'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['image', 'name', 'categoryId', 'mode'], // Обязательные поля
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Файл изображения'
                },
                mode: {
                    type: 'string',
                    enum: Object.values(SceneMode),
                    description: 'Режим сцены'
                },
                categoryId: {
                    type: 'number',
                    description: 'ID существующей категории',
                    example: 1
                },
                name: {
                    type: 'string',
                    description: 'Название сцены'
                },
                prompt: {
                    type: 'string',
                    description: 'Промпт для нейросети'
                },
            },
        },
    })
    create(
        @Body() dto: CreateSceneDto,
        @UploadedFile() file: Express.Multer.File
    ) {
        // Убедитесь, что в CreateSceneDto поле называется categoryId
        return this.sceneService.create(dto, file);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить сцену по ID' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.sceneService.remove(id);
    }
}