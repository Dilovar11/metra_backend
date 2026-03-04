import { Injectable } from '@nestjs/common';
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private client: PredictionServiceClient;

    private readonly project = process.env.GOOGLE_PROJECT_ID;
    private readonly location = process.env.GOOGLE_LOCATION || 'us-central1';

    // Используем Imagen 3 Generate — она лучше всего подходит для изменения стиля всего фото
    private readonly endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-002`;

    constructor(private readonly filesService: FilesService) {
        const credentialsJson = process.env.GOOGLE_CREDS_JSON;
        let credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;

        this.client = new PredictionServiceClient({
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
            credentials,
            projectId: this.project,
        });
    }

    /**
     * Основной метод генерации
     */
    async generate(dto: GenerateImageDto, userId: string) {
        console.log(`[Imagen 3] Старт. Пользователь: ${userId}`);

        const instancePayload: any = {
            prompt: dto.prompt,
        };

        const parametersPayload: any = {
            sampleCount: 1,
            addWatermark: false,
            personGeneration: "allow_all",
        };

        if (dto.image) {
            const base64Source = await this.getBase64FromUrl(dto.image);
            
            // ВАЖНО: Убедитесь, что здесь нет aspectRatio
            // Для Imagen 3 Image-to-Image структура должна быть ТАКОЙ:
            instancePayload.image = {
                bytesBase64Encoded: base64Source,
            };
            
            // Если ошибка 13 остается, попробуйте УМЕНЬШИТЬ этот вес до 0.4
            parametersPayload.imagePromptWeight = 0.5;
        } else {
            parametersPayload.aspectRatio = "1:1";
        }

        try {
            // Используем helpers.toValue только для объектов, 
            // но иногда SDK лучше переваривает простые объекты
            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [helpers.toValue(instancePayload) as any],
                parameters: helpers.toValue(parametersPayload) as any,
            });

            if (!response.predictions || response.predictions.length === 0) {
                throw new Error('Модель не вернула результат. Возможно, промпт заблокирован фильтрами безопасности.');
            }

            const result: any = helpers.fromValue(response.predictions[0] as any);

            // В Imagen 3 результат может быть в bytesBase64Encoded или в image
            const base64Image = result.bytesBase64Encoded || result.image;

            if (!base64Image) {
                throw new Error('Данные изображения отсутствуют в ответе модели.');
            }

            // 4. Сохраняем результат через FilesService
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: {
                    model: 'imagen-3.0-generate',
                    hasReferenceImage: !!dto.image,
                    prompt: dto.prompt
                }
            };

        } catch (error) {
            console.error('Критическая ошибка Imagen:', error);
            throw new Error(`Ошибка генерации: ${error.details || error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            // Проверяем размер (если больше 5МБ, это может быть причиной ошибки 13)
            if (response.data.byteLength > 5 * 1024 * 1024) {
                console.warn('[Imagen] Файл слишком большой, возможна ошибка INTERNAL');
            }
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (error) {
            throw new Error(`Ошибка загрузки фото: ${error.message}`);
        }
    }
}