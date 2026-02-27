import { Injectable } from '@nestjs/common';
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import { google } from '@google-cloud/aiplatform/build/protos/protos';
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private client: PredictionServiceClient;
    
    private readonly project = process.env.GOOGLE_PROJECT_ID;
    private readonly location = process.env.GOOGLE_LOCATION || 'us-central1';
    // Используем Imagen 4 Standard
    private readonly endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-4.0-generate-001`;

    constructor(private readonly filesService: FilesService) {
        this.client = new PredictionServiceClient({
            apiKey: process.env.GOOGLE_API_KEY,
        });
    }

    /**
     * Вспомогательный метод для загрузки изображения по URL и конвертации в base64
     */
    private async getBase64FromUrl(url: string): Promise<string> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (error) {
            throw new Error(`Не удалось загрузить изображение по URL: ${error.message}`);
        }
    }

    async generate(dto: GenerateImageDto, userId: string) {
        console.log(`Запрос от пользователя ${userId} к Imagen 4: ${dto.prompt}`);

        // 1. Подготовка структуры инстанса
        const instancePayload: any = {
            prompt: dto.prompt,
        };

        // Если передан URL изображения, скачиваем его и добавляем в запрос для Image-to-Image
        if (dto.image) {
            console.log(`Использование исходного изображения для генерации: ${dto.image}`);
            const base64Source = await this.getBase64FromUrl(dto.image);
            instancePayload.image = {
                bytesBase64Encoded: base64Source
            };
        }

        const parametersPayload = {
            sampleCount: 1,
            aspectRatio: "1:1", // Standard 1k
            // Можно добавить степень влияния исходного фото, если используется Image-to-Image
            // imagePromptWeight: 0.5 
        };

        // 2. Преобразование в формат Protobuf IValue
        const instanceValue = helpers.toValue(instancePayload) as any;
        const parameterValue = helpers.toValue(parametersPayload) as any;

        try {
            // 3. Вызов Google Cloud Vertex AI
            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [instanceValue],
                parameters: parameterValue,
            });

            const predictions = response.predictions;
            if (!predictions || predictions.length === 0) {
                throw new Error('Imagen 4 не вернул результат. Проверьте настройки безопасности или промпт.');
            }

            // 4. Извлечение base64 из ответа
            const result: any = helpers.fromValue(predictions[0] as any);
            const base64Image = result.bytesBase64Encoded;

            // 5. Сохранение в Cloudinary (FilesService перезапишет старый файл пользователя)
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                externalTaskId: `metra-gen-${Date.now()}`,
                status: 'success',
                originalImage: dto.image ?? null,
                processedImage: savedFile.url, // URL из Cloudinary
                metadata: {
                    type: dto.type,
                    prompt: dto.prompt,
                    timestamp: new Date().toISOString(),
                    userId: userId,
                    model: 'imagen-4.0-standard'
                }
            };
        } catch (error) {
            console.error('Ошибка в ImageGeneratorService:', error);
            throw new Error(`Ошибка генерации: ${error.message}`);
        }
    }
}