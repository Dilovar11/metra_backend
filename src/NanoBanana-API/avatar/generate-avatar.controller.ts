// src/avatar/avatar.controller.ts
import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AvatarGeneratorService } from './generate-avatar.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GenerateAvatarDto } from './dto/generate-avatar.dto'; // Используем наш новый DTO

@ApiTags('Аватары (AI)')
@Controller('avatar')
export class AvatarGeneratorController {
  constructor(private readonly avatarService: AvatarGeneratorService) {}

  @Post('generate-from-images')
  @ApiOperation({ 
    summary: 'Генерация 4 новых вариантов аватара на основе 3-х существующих изображений и пола',
    description: 'Использует мультимодальный ввод (изображения + текст) для создания новых аватаров. Возвращает до 4 изображений в формате Base64.' 
  })
  @ApiBody({ type: GenerateAvatarDto })
  @ApiResponse({ 
    status: 201, 
    description: '4 новых изображения успешно сгенерированы',
    schema: {
      example: {
        success: true,
        images: [
          'data:image/png;base64,iVBORw0KGgoAAAAN...',
          'data:image/png;base64,ABCDEFG...',
          // ... 2 more
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные или ошибка загрузки изображений' })
  @ApiResponse({ status: 500, description: 'Ошибка AI API или обработки изображений' })
  async generateFromImages(@Body() dto: GenerateAvatarDto) {
    try {
      const generatedImages = await this.avatarService.generateAvatar(dto);
      return {
        success: true,
        images: generatedImages, // Массив base64 строк
      };
    } catch (error) {
      console.error('Error in controller:', error);
      if (error instanceof BadRequestException) {
        throw error; // Propagate client-side errors
      }
      if (error.message?.includes('SAFETY')) {
        throw new BadRequestException('Запрос отклонен фильтром безопасности Google.');
      }
      throw new InternalServerErrorException('Не удалось сгенерировать аватар. Возможно, проблема с AI API или вашей конфигурацией.');
    }
  }
}