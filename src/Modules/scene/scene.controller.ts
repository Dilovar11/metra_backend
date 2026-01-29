import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SceneService } from './scene.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { SceneType } from '../../Entities/scene.entity';

@ApiTags('Scenes (Сцены)')
@Controller('scenes')
export class SceneController {
    constructor(private readonly sceneService: SceneService) { }

    @Get()
    @ApiOperation({ summary: 'Получить список всех сцен (с фильтрацией по типу)' })
    @ApiQuery({ name: 'type', enum: SceneType, required: false, description: 'Фильтр по типу сцены' })
    findAll(@Query('type') type?: SceneType) {
        return this.sceneService.findAll(type);
    }

    @Post()
    @ApiOperation({ summary: 'Создать новую сцену' })
    create(@Body() dto: CreateSceneDto) {
        return this.sceneService.create(dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить сцену по ID' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.sceneService.remove(id);
    }
}