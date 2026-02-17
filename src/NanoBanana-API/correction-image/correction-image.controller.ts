import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { CorrectionImageService } from './correction-image.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CorrectImageDto } from './dto/correct-image.dto';
import { TgUser } from '../../Common/decorators/user.decorator';

@ApiTags('Улучшение изображений')
@Controller('correction-image')
export class CorrectionImageController {
  constructor(private readonly correctionService: CorrectionImageService) {}

  @Post('improve')
  @ApiOperation({ summary: 'Улучшить качество изображения' })
  @ApiResponse({ status: 201, description: 'Изображение успешно улучшено' })
  @ApiResponse({ status: 401, description: 'Неавторизован (ошибка Telegram данных)' })
  async improve(
    @TgUser('id') userId: string,
    @Body() dto: CorrectImageDto
  ) {
    if (!dto.imageUrl) {
      throw new BadRequestException('URL изображения обязателен');
    }

    return await this.correctionService.correctImage(dto.imageUrl);
  }
}