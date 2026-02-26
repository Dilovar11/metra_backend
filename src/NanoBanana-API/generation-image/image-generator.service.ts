import { Injectable, BadRequestException } from '@nestjs/common';
import { GenerateImageDto } from './dto/generate-image.dto';

@Injectable()
export class ImageGeneratorService {
    private readonly RESULT_URL = 'https://thumbs.dreamstime.com/b/%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D1%81%D1%81-%D1%83%D1%81%D0%BF%D0%B5%D1%88%D0%BD%D0%BE-%D0%B7%D0%B0%D0%B2%D0%B5%D1%80%D1%88%D0%B8%D0%BB-%D0%B7%D0%BD%D0%B0%D1%87%D0%BE%D0%BA-%D0%B2%D0%B5%D0%BA%D1%82%D0%BE%D1%80%D0%B0-129672573.jpg';

    async generate(dto: GenerateImageDto) {
        // Логируем только если изображение есть
        if (dto.image) {
            console.log(`Обработка фото: ${dto.image}`);
        } else {
            console.log(`Генерация нового изображения без исходника`);
        }
        
        console.log(`Запрос: ${dto.prompt}`);

        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            externalTaskId: 'w0-e29b-41d4-a716-4',
            status: 'success',
            originalImage: dto.image ?? null, // Возвращаем null, если фото не было
            processedImage: this.RESULT_URL,
            metadata: {
                type: dto.type,
                prompt: dto.prompt,
                timestamp: new Date().toISOString()
            }
        };
    }
}