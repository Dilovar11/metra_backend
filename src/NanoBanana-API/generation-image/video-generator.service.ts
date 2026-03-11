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
            // 1. Инициализируем модель с версией v1beta
            const model = this.genAI.getGenerativeModel({
                model: this.modelId
            }, { apiVersion: 'v1beta' });

            const base64Data = await this.getBase64FromUrl(imageUrl);

            console.log(`[Veo] Запуск анимации для ${userId}...`);

            // 2. В последних версиях SDK для Veo используется вызов через инстанс genAI.
            // Если (model as any).generateVideos не работает, пробуем этот формат:
            let operation = await (this.genAI as any).getGenerativeModel({ model: this.modelId }, { apiVersion: 'v1beta' })
                .generateContent([
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]);

            // Если же ты хочешь использовать именно функционал Veo (а не просто мультимодальный Gemini),
            // то в JS SDK вызов часто выглядит так:
            /*
            let operation = await (this.genAI as any).models.generateVideos({
                model: this.modelId,
                prompt: prompt,
                image: { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
            });
            */

            // 3. Если ошибка "is not a function" сохраняется, значит SDK еще не обновлено.
            // Самый надежный способ сейчас — использовать прямой POST запрос через axios к Google API:
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:predictLongRunning?key=${process.env.GOOGLE_API_KEY}`,
                {
                    instances: [{
                        prompt: prompt,
                        image: { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
                    }]
                }
            );

            let operationName = response.data.name;
            let isDone = false;
            let finalResult: any;

            // 4. Поллинг (опрос готовности)
            while (!isDone) {
                console.log("Видео генерируется... (проверка через 10 сек)");
                await new Promise(r => setTimeout(r, 10000));

                const status = await axios.get(
                    `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${process.env.GOOGLE_API_KEY}`
                );

                if (status.data.done) {
                    isDone = true;
                    finalResult = status.data.response;
                }
            }

            // 5. Получаем видео из ответа
            const videoBase64 = finalResult.generatedVideos[0].video.inlineData.data;
            const savedFile = await this.filesService.saveAiGeneratedVideo(videoBase64, userId);

            return {
                status: 'success',
                videoUrl: savedFile.url
            };

        } catch (error) {
            console.error('Veo Error:', error.response?.data || error.message);
            throw new InternalServerErrorException(`Ошибка: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}