import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import axios from 'axios';

@Injectable()
export class AvatarGeneratorService {
    private genAI: GoogleGenerativeAI;
    private readonly IMAGEN_MODEL = 'gemini-1.5-flash';

    constructor() {
        const apiKey = process.env.GOOGLE_GEN_AI_KEY
        this.genAI = new GoogleGenerativeAI(apiKey!);
    }

    private async getBase64ImageFromUrl(url: string): Promise<string> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            return buffer.toString('base64');
        } catch (error) {
            throw new BadRequestException(`Не удалось загрузить изображение по ссылке: ${url}`);
        }
    }

    async generateAvatar(dto: any): Promise<string[]> {
        try {
            // Попробуем самую простую модель без префикса 'models/'
            // Если не сработает, попробуйте 'gemini-1.5-pro'
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const [img1, img2, img3] = await Promise.all([
                this.getBase64ImageFromUrl(dto.imageFront),
                this.getBase64ImageFromUrl(dto.imageLeft),
                this.getBase64ImageFromUrl(dto.imageRight),
            ]);

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: "Generate a detailed description of 4 avatar variations based on these images." },
                        { inlineData: { mimeType: 'image/png', data: img1 } },
                        { inlineData: { mimeType: 'image/png', data: img2 } },
                        { inlineData: { mimeType: 'image/png', data: img3 } },
                    ]
                }]
            });

            const response = await result.response;
            console.log('Ответ получен успешно');

            // ВАЖНО: Gemini 1.5 Flash вернет ТЕКСТ. 
            // Для генерации КАРТИНКИ (файла) нужен Imagen, 
            // но он часто недоступен в бесплатном тире v1beta.
            return [response.text()];

        } catch (error) {
            console.error('ПОЛНАЯ ОШИБКА:', error);
            throw new InternalServerErrorException(error.message);
        }
    }
}