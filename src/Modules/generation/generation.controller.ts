import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { GenerationType } from '../../Entities/generation.entity';
import { TgUser } from '../../Common/decorators/user.decorator';


@ApiTags('Generations')
@Controller('generations')
export class GenerationController {
  constructor(private readonly service: GenerationService) { }

  @Post()
  @ApiOperation({ summary: 'Сохранить генерацию' })
  @ApiResponse({ status: 201 })
  async create(
    @TgUser('id') userId: string, 
    @Body() dto: CreateGenerationDto
  ) {
    return this.service.create(userId, dto);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Генераци текущего пользователя' })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'photo', 'video'] })
  async findAll(
    @TgUser('id') userId: string, 
    @Query('filter') filter: 'all' | 'photo' | 'video' = 'all'
  ) {
    return this.service.findAll(userId, filter);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Генерации пользователя по категории' })
  async findByCategory(
    @TgUser('id') userId: string,
    @Query('type') type?: GenerationType
  ) {
    return this.service.findByUserAndType(userId, type);
  }

  @Get('prompt')
  @ApiOperation({ summary: 'Получить промпт для типа генерации' })
  @ApiQuery({ name: 'type', enum: GenerationType, required: true, description: 'Тип генерации' })
  getPrompt(@Query('type') type: GenerationType) {
    const prompt = this.service.getPromptByGenerationType(type);
    return { type, prompt };
  }
}