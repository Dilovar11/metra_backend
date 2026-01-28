import { Controller, Post, Get, Body, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  async getMyReferralInfo(@Req() req: any) {
    // req.user.id получаем из JWT токена после авторизации
    const userId = req.user.id;
    return await this.referralService.getReferralStats(userId);
  }

  @Post('generate-link')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Принудительная генерация реферального кода' })
  async generateLink(@Req() req: any) {
    return await this.referralService.getMyLink(req.user);
  }

  @Get('click-link')
  @ApiOperation({ summary: 'Обработка перехода по реферальной ссылке' })
  async handleRefClick(@Query('code') code: string, @Res() res: any) {
    if (code) {
      // Увеличиваем счетчик переходов в БД
      await this.referralService.trackClick(code);
    }
    // Перенаправляем пользователя на фронтенд регистрации с сохранением кода
    const frontendUrl = `https://metra-front-aht3.vercel.app/register?ref=${code}`;
    return res.redirect(frontendUrl);
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
