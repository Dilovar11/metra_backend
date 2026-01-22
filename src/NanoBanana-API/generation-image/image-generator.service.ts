import { Injectable, BadRequestException } from '@nestjs/common';
import { GenerateImageDto } from './dto/generate-image.dto';

@Injectable()
export class ImageGeneratorService {
    private readonly RESULT_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmgtePIhM5sWc96KUjIIZYYtLkyDcUH13hOA&s';

    async generate(dto: GenerateImageDto) {
        console.log(`Обработка фото: ${dto.image}`);
        console.log(`Запрос: ${dto.prompt}`);

        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            externalTaskId: 'w0-e29b-41d4-a716-4',
            status: 'success',
            originalImage: dto.image,
            processedImage: this.RESULT_URL,
            metadata: {
                type: dto.type,
                prompt: dto.prompt,
                timestamp: new Date().toISOString()
            }
        };
    }
}