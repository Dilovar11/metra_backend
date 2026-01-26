import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

  @Get()
  @ApiOperation({ summary: 'Все генерации' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Генерации пользователя' })
  findByUser(
    @Query('userId') userId: string,
    @Query('type') type?: GenerationType 
  ) {
    // Передаем оба параметра в сервис
    return this.service.findByUserAndType(userId, type);
  }
}
