import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@ApiTags('Support')
@Controller('support-tickets')
export class SupportTicketController {
  constructor(private readonly service: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: 'Создать тикет поддержки' })
  @ApiResponse({ status: 201, description: 'Тикет создан' })
  create(@Body() dto: CreateSupportTicketDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все тикеты (admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Тикеты пользователя' })
  findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Изменить статус тикета' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
