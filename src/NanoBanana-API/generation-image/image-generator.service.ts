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
    
    // МЕНЯЕМ МОДЕЛЬ НА FAST — она стабильнее для Image-to-Image
    private readonly endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-4.0-fast-001`;

    constructor(private readonly filesService: FilesService) {
        const credentialsJson = process.env.GOOGLE_CREDS_JSON;
        let credentials: any = undefined;
        if (credentialsJson) {
            try {
                credentials = JSON.parse(credentialsJson);
            } catch (e) {
                console.error('Ошибка парсинга GOOGLE_CREDS_JSON', e);
            }
        }

        this.client = new PredictionServiceClient({
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
            credentials: credentials,
            projectId: this.project,
        });
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            // Ограничиваем размер или проверяем его, если нужно
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (error) {
            throw new Error(`Не удалось загрузить исходное изображение: ${error.message}`);
        }
    }

    async generate(dto: GenerateImageDto, userId: string) {
        console.log(`[Imagen 4 Fast] Запуск для пользователя: ${userId}`);

        const instancePayload: any = {
            prompt: dto.prompt,
        };

        const parametersPayload: any = {
            sampleCount: 1,
        };

        // Если есть изображение, настраиваем Image-to-Image
        if (dto.image) {
            const base64Source = await this.getBase64FromUrl(dto.image);
            instancePayload.image = {
                bytesBase64Encoded: base64Source,
                mimeType: "image/jpeg"
            };
            // Убираем aspectRatio, так как fast-модель наследует его от фото
        } else {
            parametersPayload.aspectRatio = "1:1";
        }

        const instanceValue = helpers.toValue(instancePayload) as any;
        const parameterValue = helpers.toValue(parametersPayload) as any;

        try {
            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [instanceValue],
                parameters: parameterValue,
            });

            if (!response.predictions || response.predictions.length === 0) {
                throw new Error('Модель не вернула результат (возможно, блок цензуры)');
            }

            const result: any = helpers.fromValue(response.predictions[0] as any);
            const base64Image = result.bytesBase64Encoded;

            // Сохраняем в Cloudinary
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                externalTaskId: `metra-fast-${Date.now()}`,
                originalImage: dto.image ?? null,
                processedImage: savedFile.url,
                metadata: {
                    type: dto.type,
                    prompt: dto.prompt,
                    timestamp: new Date().toISOString(),
                    model: 'imagen-4.0-fast'
                }
            };
        } catch (error) {
            console.error('Критическая ошибка в ImageGeneratorService:', error);
            const detail = error.details || error.message;
            throw new Error(`Ошибка генерации (INTERNAL): ${detail}`);
        }
    }
}