import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ImageGeneratorService } from './image-generator.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { TgUser } from '../../Common/decorators/user.decorator';
import { VideoGeneratorService } from './video-generator.service';

@ApiTags('Генерация изображений')
@Controller('generations')
export class ImageGeneratorController {
    constructor(
        private readonly imageService: ImageGeneratorService,
        private readonly videoService: VideoGeneratorService
    ) { }

    @Post('generate-image')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Обработка изображения по описанию',
        description: 'Использует Imagen 4 Standard для генерации или модификации фото. Результат сохраняется в Cloudinary и перезаписывается для каждого пользователя.'
    })
    @ApiBody({ type: GenerateImageDto })
    @ApiResponse({
        status: 200,
        description: 'Изображение успешно обработано',
        schema: {
            example: {
                status: 'success',
                externalTaskId: 'metra-gen-1706832000000',
                originalImage: 'https://example.com/photo.jpg',
                processedImage: 'https://res.cloudinary.com/dncehtdoz/image/upload/v1/metra_generations/gen_12345.png',
                metadata: {
                    type: "nano_banana",
                    prompt: 'Anime style',
                    timestamp: '2026-02-27T12:00:00Z',
                    userId: '12345',
                    model: 'imagen-4.0-standard'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Ошибка валидации входных данных' })
    @ApiResponse({ status: 500, description: 'Ошибка при генерации изображения' })
    async processImage(
        @Body() dto: GenerateImageDto,
        @TgUser('id') userId: string, // Извлекаем ID пользователя Телеграм
    ) {
        // Передаем DTO и userId в сервис
        return await this.imageService.generate(dto, userId);
    }


    @Post('animate-image')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Анимация изображения (Фото в Видео)',
        description: 'Использует модель Veo 3.1 Fast для создания 5-секундной анимации из статичного фото.'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                imageUrl: { type: 'string', example: 'https://photo.jpg', description: 'URL исходного фото' },
                prompt: { type: 'string', example: 'Cinematic sunlight moving, 4k', description: 'Что должно происходить на видео' }
            },
            required: ['imageUrl', 'prompt']
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Анимация успешно создана',
        schema: {
            example: {
                status: 'success',
                videoUrl: 'https://res.cloudinary.com/.../anim_123.mp4',
                metadata: { engine: 'Google Veo 3.1 Fast', duration: '5s' }
            }
        }
    })
    @ApiResponse({ status: 500, description: 'Ошибка при создании анимации' })
    async animateImage(
        @Body() body: { imageUrl: string, prompt: string },
        @TgUser('id') userId: string,
    ) {
        // Вызываем метод анимации из нового сервиса
        return await this.videoService.animateImage(body.imageUrl, body.prompt, userId);
    }

}