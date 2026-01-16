import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NanoBananaService } from './nanobanana.service';
import { GenerateDto } from './dto/generate.dto';
import { StatusDto } from './dto/status.dto';

@ApiTags('NanoBanana')
@Controller()
export class NanoBananaController {
    constructor(private readonly service: NanoBananaService) { }

    @Post('generate')
    @ApiOperation({ summary: 'Генерация изображения' })
    @ApiResponse({ status: 200, description: 'taskId получен' })
    @ApiResponse({ status: 402, description: 'Недостаточно кредитов' })
    async generate(@Body() dto: GenerateDto) {
        return this.service.generate(dto.prompt, dto.numImages);
    }

    @Get('status')
    @ApiOperation({ summary: 'Проверка статуса генерации' })
    async status(@Query() query: StatusDto) {
        return this.service.status(query.taskId);
    }
}
