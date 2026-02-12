import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SceneCategoryService } from './scene-category.service';
import { CreateSceneCategoryDto } from './dto/create-scene-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Scene Categories (Категории сцен)')
@Controller('scene-categories')
export class SceneCategoryController {
    constructor(private readonly categoryService: SceneCategoryService) { }

    @Get()
    @ApiOperation({ summary: 'Получить все категории сцен' })
    findAll() {
        return this.categoryService.findAll();
    }

    @Post()
    @ApiOperation({ summary: 'Создать новую категорию с изображением' })
    @UseInterceptors(FileInterceptor('image')) // 
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Название категории'},
                image: { type: 'string', format: 'binary', description: 'Файл изображения' },
                description: { type: 'string', description: 'Описание категории' },
            },
        },
    })
    create(
        @Body() dto: CreateSceneCategoryDto,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.categoryService.create(dto, file);
    }


    @Delete(':id')
    @ApiOperation({ summary: 'Удалить категорию по ID' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.remove(id);
    }
}