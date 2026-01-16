import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { GenerationMediaService } from './generation-media.service';
import { CreateGenerationMediaDto } from './dto/create-generation-media.dto';

@ApiTags('GenerationMedia')
@Controller('generation-media')
export class GenerationMediaController {
  constructor(private readonly service: GenerationMediaService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить медиа к генерации' })
  @ApiResponse({ status: 201, description: 'Медиа добавлено' })
  create(@Body() dto: CreateGenerationMediaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все медиа' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-generation')
  @ApiOperation({ summary: 'Получить медиа по генерации' })
  @ApiQuery({ name: 'generationId', example: 'uuid-generation-id' })
  findByGeneration(@Query('generationId') generationId: string) {
    return this.service.findByGeneration(generationId);
  }
}
