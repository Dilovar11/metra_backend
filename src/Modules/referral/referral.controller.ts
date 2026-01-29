import { Controller, Post, Get, Body, Query, Req, Res, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';

@ApiTags('Referrals')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) { }
  @Get('info')
  // @UseGuards(JwtAuthGuard)
  //@ApiBearerAuth()
  @ApiOperation({ summary: 'Получить данные для экрана партнерской программы' })
  @ApiQuery({ name: 'userId', required: true, description: 'ID пользователя' })
  async getMyReferralInfo(@Query('userId') userId: string) {
    return await this.referralService.getReferralStats(userId);
  }

  @Post('generate-link')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Принудительная генерация реферального кода' })
  @ApiQuery({ name: 'userId', required: true, description: 'UUID пользователя' })
  async generateLink(
    @Req() req: any,
    @Query('userId') queryUserId: string,
    @Body('userId') bodyUserId: string
  ) {
    const targetId = req.user?.id || queryUserId || bodyUserId;
    if (!targetId) {
      throw new BadRequestException('userId не предоставлен');
    }
    const link = await this.referralService.getMyLink(targetId);
    return { link };
  }

  @Get('click-link')
  @ApiOperation({
    summary: 'Засчитать переход по реферальной ссылке',
    description: 'Проверяет уникальность клика'
  })
  @ApiParam({
    name: 'code',
    description: 'Уникальный реферальный код',
    example: 'REF777'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telegramId: {
          type: 'string',
          description: 'telegram-ID пользователя, который кликнул по ссылке',
          example: '123456789'
        }
      },
      required: ['telegramId']
    }
  })
  @ApiResponse({ status: 200, description: 'Обработано (клик либо засчитан, либо проигнорирован).' })
  @ApiResponse({ status: 404, description: 'Реферальный код не найден.' })
  async trackClick(
    @Param('code') code: string,
    @Body('telegramId') telegramId: string,
  ) {
    return await this.referralService.trackClick(code, telegramId);
  }


  @Post()
  @ApiOperation({ summary: 'Создать реферал' })
  @ApiResponse({ status: 201, description: 'Реферал создан' })
  create(@Body() dto: CreateReferralDto) {
    return this.referralService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Все рефералы' })
  findAll() {
    return this.referralService.findAll();
  }

  @Get('by-inviter')
  @ApiOperation({ summary: 'Рефералы по пригласившему пользователю' })
  findByInviter(@Query('inviterId') inviterId: string) {
    return this.referralService.findByInviter(inviterId);
  }
}
