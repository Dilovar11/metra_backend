import { Controller, Post, Get, Body, Query, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { TgUser } from '../../Common/decorators/user.decorator'; 

@ApiTags('Referrals')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) { }

  @Get('info')
  @ApiOperation({ summary: 'Получить данные для экрана партнерской программы' })
  async getMyReferralInfo(@TgUser('id') userId: string) {
    return await this.referralService.getReferralStats(userId);
  }

  @Post('generate-link')
  @ApiOperation({ summary: 'Принудительная генерация реферального кода' })
  async generateLink(@TgUser('id') userId: string) {
    const link = await this.referralService.getMyLink(userId);
    return { link };
  }

  @Post('click-link/:code')
  @ApiOperation({
    summary: 'Засчитать переход по реферальной ссылке',
    description: 'Проверяет уникальность клика'
  })
  @ApiParam({ name: 'code', example: 'REF777' })
  async trackClick(
    @Param('code') code: string,
    @TgUser('id') userId: string, 
  ) {
    return await this.referralService.trackClick(code, userId);
  }

  @Get('by-inviter')
  @ApiOperation({ summary: 'Рефералы по пригласившему пользователю' })
  async findByInviter(@TgUser('id') userId: string) {
    return this.referralService.findByInviter(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Создать реферал (Admin)' })
  create(@Body() dto: CreateReferralDto) {
    return this.referralService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все рефералы (Admin)' })
  findAll() {
    return this.referralService.findAll();
  }
}