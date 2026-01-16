import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Создать подписку' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все подписки' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Подписки пользователя' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Отключить подписку' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить подписку' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.service.update(id, dto);
  }
}
