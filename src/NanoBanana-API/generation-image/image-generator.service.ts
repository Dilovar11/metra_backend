import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Идеально совпадает с Python SDK
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private genAI: GoogleGenerativeAI;
    
    // --- ОПРЕДЕЛЯЕМ МОДЕЛИ (аналог Python-успеха) ---
    private readonly repairModelId = 'gemini-3.1-flash-image-preview'; // Для ремонта фото
    private readonly fastModelId = 'gemini-2.0-flash'; // Для быстрого текста (стабильная Flash модель)

    constructor(private readonly filesService: FilesService) {
        // Библиотека @google/generative-ai работает через API_KEY
        const apiKey = process.env.GOOGLE_API_KEY || ''; 
        if (!apiKey) {
            console.error(' ВНИМАНИЕ: Не задан GOOGLE_API_KEY в .env!');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generate(dto: GenerateImageDto, userId: string) {
        let modelId: string;
        let promptParts: any[] = [];

        // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ (делай так...) ---
        if (dto.image) {
            // 1. ФОТО ЕСТЬ -> Режим ремонта
            console.log(` Режим Ремонта для: ${userId}`);
            modelId = this.repairModelId;

            promptParts = [
                `SYSTEM: You are an AI image editor. Generate a new high-quality image.`,
                `PROMPT: ${dto.prompt}`
            ];

            // Добавляем картинку как в Python (Успех!)
            const base64Data = await this.getBase64FromUrl(dto.image);
            promptParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg'
                }
            });

        } else {
            // 2. ФОТО НЕТ -> Режим Fast
            console.log(` Режим Fast (Текст) для: ${userId}`);
            modelId = this.fastModelId;

            // Для Fast модели часто лучше передавать чистый промпт
            promptParts = [`${dto.prompt}`];
        }

        // --- ОТПРАВКА ЗАПРОСА ---
        try {
            // Динамически получаем нужную модель
            const model = this.genAI.getGenerativeModel({ model: modelId });

            // Вызов, аналогичный Python-скрипту
            const result = await model.generateContent(promptParts);
            const response = await result.response;
            
            // Ищем изображение в ответе (как в Python Успехе!)
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if (!imagePart || !imagePart.inlineData) {
                throw new Error('Модель не вернула изображение. Проверьте фильтры безопасности.');
            }

            const base64Image = imagePart.inlineData.data;
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { model: modelId, engine: 'Generative-AI SDK' }
            };
        } catch (error) {
            console.error('Ошибка SDK:', error.message);
            throw new Error(`Ошибка генерации: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        // Оптимизируем вес для جلوگیری ошибки 500 (как раньше)
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_1024,c_limit,q_80,f_jpg/')
            : url;

        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}