import { Controller, Post, Get, Body, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
  async generateLink(@Req() req: any, @Body('userId') userId: string) {
    const user = req.user || { id: userId };
    return await this.referralService.getMyLink(user);
  }

  @Get('click-link')
  @ApiOperation({ summary: 'Обработка перехода по реферальной ссылке' })
  @ApiQuery({ name: 'code', required: true, example: 'REF123' }) 
  async handleRefClick(@Query('code') code: string, @Res() res: any) {
    if (code) {
      await this.referralService.trackClick(code);
    }
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
