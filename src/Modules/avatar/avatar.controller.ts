import { Controller, Post, Patch, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AvatarService } from './avatar.service';
import { Avatar } from '../../Entities/avatar.entity';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { TgUser } from '../../Common/decorators/user.decorator'; 

@ApiTags('Avatars')
@Controller('avatars')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) { }

  @Post()
  @ApiOperation({ summary: 'Сохранить генерированных аватаров' })
  @ApiBody({ type: CreateAvatarDto })
  @ApiResponse({ status: 201, description: 'Аватар(ы) сохранен(ы)', type: Avatar })
  create(
    @TgUser('id') userId: number, 
    @Body() dto: CreateAvatarDto
  ): Promise<Avatar> {
    return this.avatarService.create(userId.toString(), dto);
  }

  @Get('my') 
  @ApiOperation({ summary: 'Получить свои аватары' })
  @ApiResponse({ status: 200, type: Avatar })
  findMyAvatars(@TgUser('id') userId: number): Promise<Avatar | null> {
    return this.avatarService.findByUser(userId.toString());
  }

  @Patch('add')
  @ApiOperation({ summary: 'Добавить URL изображения к своему аватару' })
  async addImage(
    @TgUser('id') userId: number,
    @Body('url') url: string
  ) {
    return await this.avatarService.addImgUrl(userId.toString(), url);
  }

  @Get() 
  @ApiOperation({ summary: 'Получить вообще все аватары в системе' })
  @ApiResponse({ status: 200, type: [Avatar] })
  findAll(): Promise<Avatar[]> {
    return this.avatarService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить конкретный аватар по его внутреннему ID' })
  @ApiParam({ name: 'id', description: 'ID аватара' })
  @ApiBody({ type: UpdateAvatarDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAvatarDto,
  ): Promise<Avatar | null> {
    return this.avatarService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить аватар' })
  @ApiParam({ name: 'id', description: 'ID аватара' })
  remove(@Param('id') id: string): Promise<void> {
    return this.avatarService.remove(id);
  }
}