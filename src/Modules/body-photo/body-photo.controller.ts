import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BodyPhotoService } from './body-photo.service';
import { CreateBodyPhotoDto } from './dto/create-body-photo.dto';

@ApiTags('BodyPhoto')
@Controller('body-photos')
export class BodyPhotoController {
  constructor(private readonly service: BodyPhotoService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить фото тела пользователя' })
  @ApiResponse({ status: 201, description: 'Фото успешно добавлено' })
  create(@Body() dto: CreateBodyPhotoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все фото' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Получить фото по пользователю' })
  @ApiQuery({ name: 'userId', example: 'uuid-user-id' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }
}
