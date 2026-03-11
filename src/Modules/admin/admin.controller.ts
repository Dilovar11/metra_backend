import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../Common/decorators/public.decorator';

@Public()
@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @ApiOperation({ summary: 'Получение статистики для админ-панели бота' })
    @Get('stats')
    async getStatistics() {
        return await this.adminService.getStats();
    }

    @Get('partner-stats')
    async getPartnerStats() {
        return await this.adminService.getPartnerStats();
    }
}