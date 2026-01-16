import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenerationService } from './generation.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { UpdateGenerationStatusDto } from './dto/update-generation-status.dto';

@ApiTags('Generations')
@Controller('generations')
export class GenerationController {
  constructor(private readonly service: GenerationService) {}

  @Post()
  @ApiOperation({ summary: 'Создать генерацию' })
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
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Обновить статус генерации' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGenerationStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
