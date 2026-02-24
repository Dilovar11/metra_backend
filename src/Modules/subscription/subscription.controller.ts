import { Controller, Post, Get, Patch, Param, Body, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TgUser } from '../../Common/decorators/user.decorator';
import { Public } from 'src/Common/decorators/public.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) { }

  @Post()
  @ApiOperation({ summary: 'Создать или обновить подписку текущего пользователя' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Подписка успешно создана' })
  async create(
    @TgUser('id') userId: string, 
    @Body() dto: CreateSubscriptionDto 
  ) {
    return this.service.create(userId, dto);
  }

  @Public()
  @Get('by-user')
  @ApiOperation({ summary: 'Получить активную подписку текущего пользователя' })
  async findByUser(@TgUser('id') userId: string) {
    return this.service.findByUser(userId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Отключить подписку' })
  async deactivate(
    @TgUser('id') userId: string, 
    @Param('id') id: string
  ) {
    return this.service.deactivate(id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Все подписки (Admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить подписку (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.service.update(id, dto);
  }
}