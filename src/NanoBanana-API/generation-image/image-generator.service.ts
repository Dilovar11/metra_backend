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
        // 1. Получаем строку JSON из переменных окружения (для Vercel)
        const credentialsJson = process.env.GOOGLE_CREDS_JSON;

        let credentials: any = undefined;
        if (credentialsJson) {
            try {
                // 2. Парсим строку в объект
                credentials = JSON.parse(credentialsJson);
            } catch (e) {
                console.error('Ошибка парсинга GOOGLE_CREDS_JSON. Проверьте формат в настройках Vercel.', e);
            }
        }

        // 3. Инициализируем клиент с передачей объекта credentials напрямую
        this.client = new PredictionServiceClient({
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
            credentials: credentials,
            projectId: this.project,
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
            throw new Error(`Не удалось загрузить исходное изображение: ${error.message}`);
        }
    }

    async generate(dto: GenerateImageDto, userId: string) {
        console.log(`[Imagen 4] Запуск генерации для пользователя: ${userId}`);

        // 1. Подготовка структуры инстанса
        const instancePayload: any = {
            prompt: dto.prompt,
        };

        // Если передан URL изображения
        if (dto.image) {
            console.log(`[Imagen 4] Загрузка референса: ${dto.image}`);
            const base64Source = await this.getBase64FromUrl(dto.image);

            // В Imagen 4 для Image-to-Image объект image должен содержать mimeType
            instancePayload.image = {
                bytesBase64Encoded: base64Source,
                mimeType: "image/jpeg" // Указываем явно, чтобы избежать INTERNAL error
            };
        }

        // 2. Параметры запроса
        const parametersPayload: any = {
            sampleCount: 1,
        };

        // ВАЖНО: aspectRatio можно указывать ТОЛЬКО если нет входного изображения
        if (!dto.image) {
            parametersPayload.aspectRatio = "1:1";
        } else {
            // Если есть фото, можно добавить силу влияния промпта на фото (от 0 до 1)
            // parametersPayload.imagePromptWeight = 0.5; 
        }

        const instanceValue = helpers.toValue(instancePayload) as any;
        const parameterValue = helpers.toValue(parametersPayload) as any;

        try {
            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [instanceValue],
                parameters: parameterValue,
            });

            const predictions = response.predictions;
            if (!predictions || predictions.length === 0) {
                throw new Error('Imagen 4 не вернул результат. Проверьте промпт на цензуру.');
            }

            const result: any = helpers.fromValue(predictions[0] as any);
            const base64Image = result.bytesBase64Encoded;

            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                externalTaskId: `metra-${Date.now()}`,
                originalImage: dto.image ?? null,
                processedImage: savedFile.url,
                metadata: {
                    type: dto.type,
                    prompt: dto.prompt,
                    timestamp: new Date().toISOString(),
                    model: 'imagen-4.0-standard'
                }
            };
        } catch (error) {
            console.error('Ошибка в ImageGeneratorService:', error);
            const errorMessage = error.details || error.message;
            throw new Error(`Ошибка генерации: ${errorMessage}`);
        }
    }
}