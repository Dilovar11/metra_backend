import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private genAI: GoogleGenerativeAI;

    // Это та самая модель, которая выдала УСПЕХ в питоне. 
    // Она генерирует КАРТИНКИ, а не текст.
    private readonly modelId = 'gemini-3.1-flash-image-preview';

    constructor(private readonly filesService: FilesService) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generate(dto: GenerateImageDto, userId: string) {
        const model = this.genAI.getGenerativeModel({ model: this.modelId });
        let promptParts: any[] = [];

        if (dto.image) {
            // СЛУЧАЙ 1: Ремонт/Изменение готового фото
            const base64Data = await this.getBase64FromUrl(dto.image);
            promptParts = [
                { text: "TASK: Act as an expert interior architect. Edit this photo to match the request." },
                { text: `REQUEST: ${dto.prompt}. Keep the room layout but change materials to high-end luxury.` },
                { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
            ];
        } else {
            // СЛУЧАЙ 2: Создание новой картинки с нуля (без фото)
            promptParts = [
                { text: "TASK: You are a professional photorealistic image generator." },
                { text: `GENERATE_IMAGE: ${dto.prompt}. Ultra-realistic, 8k resolution, interior design style.` }
            ];
        }

        try {
            // Отправляем запрос
            const result = await model.generateContent({ contents: [{ role: 'user', parts: promptParts }] });
            const response = await result.response;

            // Извлекаем КАРТИНКУ из ответа (как в твоем успешном тесте)
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if (!imagePart || !imagePart.inlineData) {
                // Если вдруг модель ответила текстом вместо картинки (бывает при жесткой цензуре)
                throw new Error('Google заблокировал генерацию этой картинки или вернул текст вместо изображения.');
            }

            const base64Image = imagePart.inlineData.data;

            // Сохраняем готовую картинку
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { model: this.modelId, type: dto.image ? 'edit' : 'create' }
            };
        } catch (error) {
            console.error('Ошибка генерации:', error.message);
            throw new Error(`Ошибка Nano Banana: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_1024,c_limit,q_80,f_jpg/')
            : url;
        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}