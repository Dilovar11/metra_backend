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
        const model = this.genAI.getGenerativeModel({ model: this.modelId });

        try {
            console.log(`[Avatar Gen] Создание аватара для: ${dto.name} (${dto.gender})`);

            // Загружаем и сжимаем все 3 ракурса
            const [frontBase64, leftBase64, rightBase64] = await Promise.all([
                this.getBase64FromUrl(dto.imageFront),
                this.getBase64FromUrl(dto.imageLeft),
                this.getBase64FromUrl(dto.imageRight),
            ]);

            // Формируем запрос с 3-мя фото и инструкцией
            const promptParts = [
                { text: `TASK: Create a professional 3D avatar based on these 3 reference photos.` },
                { text: `NAME: ${dto.name}, GENDER: ${dto.gender}. Style: Realistic Pixar-style character, high detail, studio lighting.` },
                { inlineData: { data: frontBase64, mimeType: 'image/jpeg' } },
                { inlineData: { data: leftBase64, mimeType: 'image/jpeg' } },
                { inlineData: { data: rightBase64, mimeType: 'image/jpeg' } }
            ];

            const generationTasks = [1, 2, 3, 4].map(async (i) => {
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [...promptParts, { text: `Variant ${i}` }] }]
                });
                const response = await result.response;
                const parts = response.candidates?.[0]?.content?.parts;
                const imagePart = parts?.find(p => p.inlineData);

                // Защита от undefined (ts 18048)
                if (!imagePart?.inlineData?.data) {
                    throw new Error(`Модель не вернула данные для варианта ${i}`);
                }

                const base64Image = imagePart.inlineData.data;

                // Сохраняем. Если сервис возвращает массив, берем [0].
                const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

                // Безопасное получение URL
                return Array.isArray(savedFile) ? savedFile[0].url : savedFile.url;
            });

            const finalUrls = await Promise.all(generationTasks);

            return {
                name: dto.name,
                gender: dto.gender,
                imagesURL: finalUrls,
                metadata: { engine: 'Nano Banana 2 Multi-View' }
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