import { Controller, Post, Patch, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AvatarService } from './avatar.service';
import { Avatar } from '../../Entities/avatar.entity';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@ApiTags('Avatars')
@Controller('avatars')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) { }

  @Post()
  @ApiOperation({ summary: 'Сохранить генерированных аватаров' })
  @ApiBody({ type: CreateAvatarDto })
  @ApiResponse({ status: 201, description: 'Аватар(ы) сохранен(ы)', type: Avatar })
  create(@Body() dto: CreateAvatarDto): Promise<Avatar> {
    return this.avatarService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все аватары' })
  @ApiResponse({ status: 200, type: [Avatar] })
  findAll(): Promise<Avatar[]> {
    return this.avatarService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить аватар по User ID' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  @ApiResponse({ status: 200, type: Avatar })
  findByUser(@Param('userId') userId: string): Promise<Avatar | null> {
    return this.avatarService.findByUser(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить аватар' })
  @ApiParam({ name: 'id', description: 'ID аватара' })
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({ status: 200, type: Avatar })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAvatarDto,
  ): Promise<Avatar | null> {
    return this.avatarService.update(id, dto);
  }

  @Patch('add/:userId')
  async addImage(
    @Param('userId') userId: string,
    @Body('url') url: string
  ) {
    return await this.avatarService.addImgUrl(userId, url);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить аватар' })
  @ApiParam({ name: 'id', description: 'ID аватара' })
  @ApiResponse({ status: 200, description: 'Аватар удалён' })
  remove(@Param('id') id: string): Promise<void> {
    return this.avatarService.remove(id);
  }
}
