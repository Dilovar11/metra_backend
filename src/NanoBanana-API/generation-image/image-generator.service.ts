import { Injectable, BadRequestException } from '@nestjs/common';
import { GenerateImageDto } from './dto/generate-image.dto';

@Injectable()
export class ImageGeneratorService {
    // Ссылка на результат (та самая картинка "Успешно")
    private readonly RESULT_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmgtePIhM5sWc96KUjIIZYYtLkyDcUH13hOA&s';

    async generate(dto: GenerateImageDto) {
        console.log(`Обработка фото: ${dto.image}`);
        console.log(`Запрос: ${dto.prompt}`);

        // Имитация "тяжелой" обработки фото (3 секунды)
        await new Promise(resolve => setTimeout(resolve, 3000));

        return {
            status: 'success',
            originalImage: dto.image,
            processedImage: this.RESULT_URL,
            metadata: {
                prompt: dto.prompt,
                timestamp: new Date().toISOString()
            }
        };
    }
}