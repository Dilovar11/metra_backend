import { Controller, Post, Get, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { GenerationType } from 'src/Entities/generation.entity';

@ApiTags('Generations')
@Controller('generations')
export class GenerationController {
  constructor(private readonly service: GenerationService) { }

  @Post()
  @ApiOperation({ summary: 'Сохранить генерацию' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateGenerationDto) {
    return this.service.create(dto);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Все генерации текущего пользователя по фильтру' })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'photo', 'video'] })
  findAll(
    @Req() req: any,
    @Query('filter') filter: 'all' | 'photo' | 'video' = 'all'
  ) {
    const userId = req.user.id;
    return this.service.findAll(userId, filter);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Генерации пользователя по категории' })
  findByUser(
    @Query('userId') userId: string,
    @Query('type') type?: GenerationType
  ) {
    // Передаем оба параметра в сервис
    return this.service.findByUserAndType(userId, type);
  }
}
