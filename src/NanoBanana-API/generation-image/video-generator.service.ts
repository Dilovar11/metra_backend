import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilesService } from '../../Modules/file/file.service';
import axios from 'axios';

@Injectable()
export class VideoGeneratorService {
    private genAI: any; 
    private readonly modelId = 'veo-3.1-fast-generate-preview';

    constructor(private readonly filesService: FilesService) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        // Veo работает только через v1beta
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async animateImage(imageUrl: string, prompt: string, userId: string) {
        try {
            // Указываем версию v1beta для доступа к Veo
            const client = this.genAI.getGenerativeModel({ model: this.modelId }, { apiVersion: 'v1beta' });

            const base64Data = await this.getBase64FromUrl(imageUrl);

            console.log(`[Veo] Запуск анимации для пользователя ${userId}...`);

            // 1. ВЫЗОВ СПЕЦИАЛЬНОГО МЕТОДА generateVideos
            let operation = await (client as any).generateVideos({
                model: this.modelId,
                prompt: prompt,
                image: {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg'
                    }
                }
            });

            // 2. ОЖИДАНИЕ (Polling)
            // Видео не возвращается сразу, нужно проверять статус операции
            while (!operation.done) {
                console.log("Видео еще генерируется... ждем 10 секунд");
                await new Promise(resolve => setTimeout(resolve, 10000));
                
                // Обновляем данные об операции через API
                operation = await (this.genAI as any).operations.get(operation.name);
            }

            // 3. ПОЛУЧЕНИЕ РЕЗУЛЬТАТА
            const generatedVideo = operation.response.generatedVideos[0];
            const videoBase64 = generatedVideo.video.inlineData.data;

            // 4. СОХРАНЕНИЕ
            const savedFile = await this.filesService.saveAiGeneratedVideo(videoBase64, userId);

            return {
                status: 'success',
                videoUrl: savedFile.url,
                metadata: { model: this.modelId, engine: 'Google Veo 3.1' }
            };

        } catch (error) {
            console.error('Veo Error:', error.message);
            throw new InternalServerErrorException(`Ошибка анимации: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}