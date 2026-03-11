import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilesService } from '../../Modules/file/file.service';
import axios from 'axios';

@Injectable()
export class VideoGeneratorService {
    private genAI: GoogleGenerativeAI;
    
    // В 2026 году для анимации используем модель Veo
    private readonly modelId = 'veo-3.1-fast-generate-preview'; 

    constructor(private readonly filesService: FilesService) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async animateImage(imageUrl: string, prompt: string, userId: string) {
        // Инициализируем модель Veo
        const model = this.genAI.getGenerativeModel({ model: this.modelId });

        try {
            console.log(`[Veo Animation] Запуск анимации для пользователя: ${userId}`);

            // 1. Готовим исходное фото (сжимаем до 512 для видео-референса)
            const base64Data = await this.getBase64FromUrl(imageUrl);

            // 2. Формируем запрос для анимации
            const promptParts = [
                { text: `ANIMATE: ${prompt}. Cinematic movement, high quality, 4k, smooth transition.` },
                { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
            ];

            // 3. Генерация видео (занимает время!)
            // Важно: Veo может требовать более длинный таймаут
            const result = await model.generateContent({ contents: [{ role: 'user', parts: promptParts }] });
            const response = await result.response;

            // 4. Ищем видео в ответе (в Veo это обычно inlineData с типом video/mp4)
            const videoPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if (!videoPart || !videoPart.inlineData) {
                throw new Error('Модель не смогла создать анимацию. Попробуйте другой промпт.');
            }

            const videoBase64 = videoPart.inlineData.data;

            const savedFile = await this.filesService.saveAiGeneratedVideo(videoBase64, userId); 

            return {
                status: 'success',
                videoUrl: savedFile.url,
                metadata: { engine: 'Google Veo 1.0', duration: '5s' }
            };

        } catch (error) {
            console.error('Ошибка анимации:', error.message);
            throw new InternalServerErrorException(`Ошибка анимации: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_512,c_limit,q_80,f_jpg/')
            : url;
        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}