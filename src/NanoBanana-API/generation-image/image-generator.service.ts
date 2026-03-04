import { Injectable } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai'; 
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private vertexAI: VertexAI;

    private readonly project = process.env.GOOGLE_PROJECT_ID;
    private readonly location = process.env.GOOGLE_LOCATION || 'us-central1';

    // Используем ID, который принес успех в Python
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
        // Получаем модель Nano Banana 2
        const model = this.vertexAI.getGenerativeModel({ model: this.geminiModelId });

        if (dto.image) {
            console.log(`[Nano Banana 2] Режим Редактирования для: ${userId}`);
            return this.generateWithNano(model, dto, userId);
        } else {
            console.log(`[Nano Banana 2] Режим Генерации по тексту для: ${userId}`);
            return this.generateWithNano(model, dto, userId);
        }
    }

    private async generateWithNano(model: any, dto: GenerateImageDto, userId: string) {
        const parts: any[] = [{ text: `TASK: Generate a new high-quality image. ${dto.prompt}` }];

        // Если есть картинка, добавляем её как inlineData (как в Python успехе)
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
            
            // Ищем байты изображения в ответе
            const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
            
            if (!imagePart || !imagePart.inlineData) {
                // Проверяем, не ответила ли модель текстом (отказ или описание)
                const textPart = response.candidates?.[0]?.content?.parts.find((p: any) => p.text);
                throw new Error(textPart?.text || 'Модель не вернула изображение.');
            }

            const base64Image = imagePart.inlineData.data;
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
            console.error('Nano Banana Error:', error.message);
            throw new Error(`Ошибка генерации: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        // Оптимизируем размер для предотвращения 500 ошибки
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_1024,c_limit,q_80,f_jpg/')
            : url;

        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}