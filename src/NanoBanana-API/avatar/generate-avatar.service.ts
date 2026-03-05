import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilesService } from '../../Modules/file/file.service'; // Предполагаю, что он тут
import { GenerateAvatarDto } from './dto/generate-avatar.dto';
import axios from 'axios';

@Injectable()
export class AvatarGeneratorService {
    private genAI: GoogleGenerativeAI;
    private readonly modelId = 'gemini-3.1-flash-image-preview';

    constructor(private readonly filesService: FilesService) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateAvatar(dto: GenerateAvatarDto, userId: string): Promise<any> {
        // 1. Очищаем конфиг от несуществующих полей
        const model = this.genAI.getGenerativeModel({
            model: this.modelId,
            // Оставляем только те поля, которые SDK понимает
            generationConfig: {
                candidateCount: 1,
                // responseMimeType: "image/jpeg" // Если SDK поддерживает принудительный формат
            }
        });

        try {
            console.log(`[Avatar Gen] Создание аватара для: ${dto.name}`);

            const [frontBase64, leftBase64, rightBase64] = await Promise.all([
                this.getBase64FromUrl(dto.imageFront),
                this.getBase64FromUrl(dto.imageLeft),
                this.getBase64FromUrl(dto.imageRight),
            ]);

            // 2. Указываем размер прямо в системной инструкции
            const promptParts = [
                { text: `TASK: Create a professional 3D avatar. Output resolution: 512x512 pixels.` },
                { text: `STYLE: Pixar-style, high detail. NAME: ${dto.name}, GENDER: ${dto.gender}.` },
                { inlineData: { data: frontBase64, mimeType: 'image/jpeg' } },
                { inlineData: { data: leftBase64, mimeType: 'image/jpeg' } },
                { inlineData: { data: rightBase64, mimeType: 'image/jpeg' } }
            ];

            const generationTasks = [1, 2, 3, 4].map(async (i) => {
                // Добавляем напоминание про размер в каждый запрос
                const result = await model.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [...promptParts, { text: `Generate variant ${i}. Remember: square 512x512 image.` }]
                    }]
                });

                const response = await result.response;
                const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

                if (!imagePart?.inlineData?.data) {
                    throw new Error(`Модель не вернула изображение для варианта ${i}`);
                }

                const base64Image = imagePart.inlineData.data;
                const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

                return Array.isArray(savedFile) ? savedFile[0].url : savedFile.url;
            });

            const finalUrls = await Promise.all(generationTasks);

            return {
                name: dto.name,
                gender: dto.gender,
                imagesURL: finalUrls,
                metadata: { engine: 'Nano Banana 2', size: '512x512' }
            };

        } catch (error) {
            console.error('Avatar Service Error:', error.message);
            throw new InternalServerErrorException('Ошибка при генерации аватара: ' + error.message);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_512,c_limit,q_70,f_jpg/') // Сжимаем сильнее, так как фото 3 штуки
            : url;
        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}