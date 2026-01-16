import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Post()
  @ApiOperation({ summary: 'Создать реферал' })
  @ApiResponse({ status: 201, description: 'Реферал создан' })
  create(@Body() dto: CreateReferralDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все рефералы' })
  findAll() {
    return this.service.findAll();
  }

  @Get('by-inviter')
  @ApiOperation({ summary: 'Рефералы по пригласившему пользователю' })
  findByInviter(@Query('inviterId') inviterId: string) {
    return this.service.findByInviter(inviterId);
  }
}
