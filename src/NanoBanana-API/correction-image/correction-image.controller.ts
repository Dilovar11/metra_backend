import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CorrectionImageService } from './correction-image.service';
import { ApiTags, ApiOperation} from '@nestjs/swagger';
import { CorrectImageDto } from './dto/correct-image.dto';

@ApiTags('Улучшение изображений')
@Controller('correction-image')
export class CorrectionImageController {
  constructor(private readonly correctionService: CorrectionImageService) {}

  @Post('improve')
  @ApiOperation({ summary: 'Улучшить качество изображения' })
  async improve(@Body() dto: CorrectImageDto) {
    if (!dto.imageUrl) {
      throw new BadRequestException('URL изображения обязателен');
    }
    return await this.correctionService.correctImage(dto.imageUrl);
  }
}