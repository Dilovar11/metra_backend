import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import axios from 'axios';
import { GenerateAvatarDto } from './dto/generate-avatar.dto';

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
        const model = this.genAI.getGenerativeModel({ model: this.IMAGEN_MODEL });

        const [img1, img2, img3] = await Promise.all([
            this.getBase64ImageFromUrl(dto.imageFront),
            this.getBase64ImageFromUrl(dto.imageLeft),
            this.getBase64ImageFromUrl(dto.imageRight),
        ]);

        const parts: Part[] = [
            { text: `Based on these 3 views of a ${dto.gender}, generate 4 variations...` },
            { inlineData: { mimeType: 'image/png', data: img1 } },
            { inlineData: { mimeType: 'image/png', data: img2 } },
            { inlineData: { mimeType: 'image/png', data: img3 } },
        ];

        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts }],
            });

            const response = await result.response;

            const images = response.candidates!
                .map((candidate) => {
                    const part = candidate.content.parts[0];
                    if (part && part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                    return null; 
                })
                .filter((img): img is string => img !== null); 

            return images;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Ошибка генерации через Google API');
        }
    }
}