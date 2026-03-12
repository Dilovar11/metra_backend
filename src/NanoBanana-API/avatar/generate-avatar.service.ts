import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FilesService } from '../../Modules/file/file.service';
import { GenerateAvatarDto } from './dto/generate-avatar.dto';
import axios from 'axios';
import { User } from '../../Entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBalanceService } from '../../Modules/token-balance/token-balance.service';

@Injectable()
export class AvatarGeneratorService {
    private genAI: GoogleGenerativeAI;
    private readonly modelId = 'gemini-3.1-flash-image-preview';

    constructor(
        private readonly filesService: FilesService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private tokenBalanceService: TokenBalanceService,
    ) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateAvatar(dto: GenerateAvatarDto, userId: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

        // --- ОБНОВЛЯЕМ ФЛАГ ПОЛЬЗОВАТЕЛЯ ПОСЛЕ УСПЕХА ---
        user.generatedAvatar = true;
        await this.userRepository.save(user);

        // -----------------------------------------------

        // --- ЛОГИКА ПРОВЕРКИ ОПЛАТЫ / ПЕРВОЙ ГЕНЕРАЦИИ ---
        if (user.generatedAvatar === true) {
            // Если уже генерировал раньше — списываем 20 токенов
            // Метод subtractTokens сам выкинет BadRequestException, если токенов не хватит
            await this.tokenBalanceService.subtractTokens(userId, 20, 'Генерация аватара');
        }
        // Если user.generatedAvatar === false, ничего не списываем (бесплатно первый раз)
        // ------------------------------------------------

        const model = this.genAI.getGenerativeModel({ model: this.modelId });

        try {
            console.log(`[Avatar Gen] Создание аватара для: ${dto.name} (${dto.gender})`);

            // Загружаем ракурсы
            const [frontBase64, leftBase64, rightBase64] = await Promise.all([
                this.getBase64FromUrl(dto.imageFront),
                this.getBase64FromUrl(dto.imageLeft),
                this.getBase64FromUrl(dto.imageRight),
            ]);

            const promptParts = [
                { text: `TASK: Create a professional 3D avatar based on these 3 reference photos. Image size 256x256` },
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
                const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                if (!imagePart?.inlineData?.data) {
                    throw new Error(`Модель не вернула данные для варианта ${i}`);
                }

                const base64Image = imagePart.inlineData.data;
                const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);
                return Array.isArray(savedFile) ? savedFile[0].url : savedFile.url;
            });

            const finalUrls = await Promise.all(generationTasks);

            // --- ОБНОВЛЯЕМ ФЛАГ ПОЛЬЗОВАТЕЛЯ ПОСЛЕ УСПЕХА ---
            //if (user.generatedAvatar === false) {
              //  user.generatedAvatar = true;
                //await this.userRepository.save(user);
            //}
            // -----------------------------------------------

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