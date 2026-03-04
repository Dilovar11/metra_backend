import { Injectable } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai'; 
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private vertexAI: VertexAI;

    // Берем данные из окружения, как в твоем проекте
    private readonly project = process.env.GOOGLE_PROJECT_ID || 'metra-488710';
    private readonly location = process.env.GOOGLE_LOCATION || 'us-central1';

    // Используем ID, который выдал "Успех" в Python тесте
    // ВАЖНО: Без префикса "models/", так как SDK добавит его сам
    private readonly geminiModelId = 'gemini-3.1-flash-image-preview'; 

    constructor(private readonly filesService: FilesService) {
        const credentialsJson = process.env.GOOGLE_CREDS_JSON;
        const credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;

        this.vertexAI = new VertexAI({ 
            project: this.project, 
            location: this.location,
            googleAuthOptions: { credentials } 
        });
    }

    async generate(dto: GenerateImageDto, userId: string) {
        // Инициализируем модель Nano Banana 2
        const model = this.vertexAI.getGenerativeModel({ 
            model: this.geminiModelId 
        });

        console.log(`[Nano Banana 2] Запуск генерации для пользователя: ${userId}`);
        return this.generateWithNano(model, dto, userId);
    }

    private async generateWithNano(model: any, dto: GenerateImageDto, userId: string) {
        // Формируем части запроса, как в успешном Python скрипте
        const parts: any[] = [
            { text: `SYSTEM: You are an AI image editor. Generate a new high-quality image based on the input.` },
            { text: `PROMPT: ${dto.prompt}` }
        ];

        // Если пришло фото, конвертируем в Base64 и добавляем в запрос
        if (dto.image) {
            const base64Source = await this.getBase64FromUrl(dto.image);
            parts.push({
                inlineData: {
                    data: base64Source,
                    mimeType: 'image/jpeg'
                }
            });
        }

        const request = {
            contents: [{ role: 'user', parts }]
        };

        try {
            const result = await model.generateContent(request);
            const response = result.response;
            
            // Ищем данные изображения в ответе (inlineData)
            const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
            
            if (!imagePart || !imagePart.inlineData) {
                // Если картинки нет, проверяем, не вернула ли модель текстовую ошибку
                const textPart = response.candidates?.[0]?.content?.parts.find((p: any) => p.text);
                throw new Error(textPart?.text || 'Модель не вернула изображение. Проверьте фильтры безопасности в Google Console.');
            }

            const base64Image = imagePart.inlineData.data;
            
            // Сохраняем через твой FilesService
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { 
                    model: this.geminiModelId,
                    engine: 'Nano Banana 2'
                }
            };
        } catch (error) {
            console.error('Критическая ошибка Nano Banana:', error.message);
            throw new Error(`Ошибка генерации: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        // Оптимизируем URL Cloudinary для уменьшения веса (чтобы не было ошибки 500)
        // Сжимаем до 1024px, качество 80%
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_1024,c_limit,q_80,f_jpg/')
            : url;

        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}