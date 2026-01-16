import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@ApiTags('Purchases')
@Controller('purchases')
export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}

  @Post()
  @ApiOperation({ summary: 'Создать покупку' })
  @ApiResponse({ status: 201, description: 'Покупка создана' })
  create(@Body() dto: CreatePurchaseDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все покупки' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Покупки пользователя' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }
}
