import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AvatarGeneratorService } from './generate-avatar.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GenerateAvatarDto } from './dto/generate-avatar.dto';
import { TgUser } from '../../Common/decorators/user.decorator';
import { Public } from '../../Common/decorators/public.decorator';

@Public()
@ApiTags('Генерация аватара')
@Controller('avatars')
export class AvatarGeneratorController {
  constructor(private readonly avatarService: AvatarGeneratorService) { }

  @Post('generate-avatar')
  @ApiOperation({
    summary: 'Генерация новых вариантов аватара на основе существующих изображений',
    description: 'Использует предоставленные изображения для создания новых аватаров'
  })
  @ApiBody({ type: GenerateAvatarDto })
  @ApiResponse({
    status: 201,
    description: 'Изображения успешно сгенерированы',
    schema: {
      example: {
        success: true,
        images: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
      }
    }
  })
  async generateFromImages(
    @TgUser('id') userId: number, // Получаем ID из проверенного заголовка Telegram
    @Body() dto: GenerateAvatarDto
  ) {
    try {
      // Передаем userId в сервис, если он нужен для именования файлов/папок
      // Если сервис пока не принимает userId, его стоит туда добавить вторым аргументом
      const generatedImages = await this.avatarService.generateAvatar(dto);

      return {
        success: true,
        images: generatedImages,
      };
    } catch (error) {
      console.error('Error in controller:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Обработка специфической ошибки безопасности Google
      if (error.message?.includes('SAFETY')) {
        throw new BadRequestException('Запрос отклонен фильтром безопасности Google.');
      }

      throw new InternalServerErrorException(
        'Не удалось сгенерировать аватар. Возможно, проблема с AI API или вашей конфигурацией.'
      );
    }
  }
}