import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ImageGeneratorService } from './image-generator.service';
import { GenerateImageDto } from './dto/generate-image.dto';

@ApiTags('Генерация изображений') 
@Controller('generate-image')
export class ImageGeneratorController {
    constructor(private readonly imageService: ImageGeneratorService) {}

    @Post('process')
    @UsePipes(new ValidationPipe())
    @ApiOperation({ 
        summary: 'Обработка изображения по описанию', 
        description: 'Принимает ссылку на фото и текстовый запрос, возвращает ссылку на обработанный результат' 
    })
    @ApiBody({ type: GenerateImageDto })
    @ApiResponse({ 
        status: 200, 
        description: 'Изображение успешно обработано',
        schema: {
            example: {
                status: 'success',
                originalImage: 'https://example.com/photo.jpg',
                processedImage: 'https://encrypted-tbn3.gstatic.com/...',
                metadata: {
                    prompt: 'Anime style',
                    timestamp: '2026-01-22T12:00:00Z'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Ошибка валидации входных данных' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    async processImage(@Body() dto: GenerateImageDto) {
        return await this.imageService.generate(dto);
    }
}