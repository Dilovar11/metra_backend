import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TgUser } from '../../Common/decorators/user.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Получение статистики для админ-панели бота' })
  @Get('stats')
  async getStatistics(@TgUser('id') userId: string) {
    return await this.adminService.getStats();
  }
}