import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SceneService } from './scene.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { SceneType, SceneMode } from '../../Entities/scene.entity';
import { FileInterceptor } from '@nestjs/platform-express';

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
        name: 'type',
        enum: SceneType,
        required: false,
        description: 'Фильтр по типу сцены'
    })
    findAll(
        @Query('mode') mode?: SceneMode,
        @Query('type') type?: SceneType,
    ) {
        // Передаем оба параметра в сервис
        return this.sceneService.findAll(mode, type);
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
            properties: {
                image: { type: 'string', format: 'binary' },
                mode: { type: 'string', enum: Object.values(SceneMode) },
                type: { type: 'string', enum: Object.values(SceneType) },
                name: { type: 'string' },
                description: { type: 'string' },
                prompt: { type: 'string' },
            },
        },
    })
    create(@Body() dto: CreateSceneDto, @UploadedFile() file: Express.Multer.File) {
        return this.sceneService.create(dto, file);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить сцену по ID' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.sceneService.remove(id);
    }
}