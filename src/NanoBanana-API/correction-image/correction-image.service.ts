import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilesService } from '../../Modules/file/file.service';
import { TokenBalanceService } from '../../Modules/token-balance/token-balance.service';
import axios from 'axios';

@Injectable()
export class CorrectionImageService {
    private genAI: GoogleGenerativeAI;
    private readonly modelId = 'gemini-3.1-flash-image-preview';

    constructor(
        private readonly filesService: FilesService,
        private readonly tokenBalanceService: TokenBalanceService
    ) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async correctImage(imageUrl: string, userId: string) {
        // 1. Списываем токены (например, 2 токена за улучшение)
        await this.tokenBalanceService.subtractTokens(userId, 2, 'Улучшение качества изображения');

        const model = this.genAI.getGenerativeModel({ model: this.modelId });

        try {
            console.log(`Начинаем улучшение изображения для пользователя ${userId}: ${imageUrl}`);

            // 2. Получаем картинку и конвертируем в Base64
            const base64Data = await this.getBase64FromUrl(imageUrl);

            // 3. Формируем задачу для Gemini
            const promptParts = [
                { text: "TASK: High-end Photo Restoration and Enhancement. Fix lighting, remove noise, and improve sharpness." },
                { text: "Keep the original content exactly the same, but make it look like it was shot on a professional 8k camera." },
                { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
            ];

            // 4. Запрос к нейросети
            const result = await model.generateContent({ contents: [{ role: 'user', parts: promptParts }] });
            const response = await result.response;
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if (!imagePart?.inlineData?.data) {
                // Возвращаем токены, если ИИ не выдал картинку
                await this.tokenBalanceService.addTokens(userId, 2, 'Возврат: ошибка ИИ');
                throw new Error('Модель не смогла обработать изображение (возможно, цензура).');
            }

            const base64Image = imagePart.inlineData.data;

            // 5. Сохраняем улучшенное фото через FilesService
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                success: true,
                originalImage: imageUrl,
                improvedImage: savedFile.url,
                status: 'completed',
                processedAt: new Date().toISOString(),
                metadata: { model: this.modelId, cost: 2 }
            };

        } catch (error) {
            console.error('Ошибка улучшения изображения:', error.message);
            // Возврат токенов при техническом сбое
            await this.tokenBalanceService.addTokens(userId, 2, 'Возврат: технический сбой');
            throw new Error(`Ошибка коррекции Nano Banana: ${error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        // Оптимизация для Cloudinary, если нужно
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_1024,c_limit,q_80,f_jpg/')
            : url;
        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}