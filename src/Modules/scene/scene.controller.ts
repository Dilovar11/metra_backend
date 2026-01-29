import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SceneService } from './scene.service';
import { CreateSceneDto } from './dto/create-scene.dto';

@ApiTags('Scenes (Сцены)')
@Controller('scenes')
export class SceneController {
  constructor(private readonly sceneService: SceneService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех сцен' })
  findAll() {
    return this.sceneService.findAll();
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