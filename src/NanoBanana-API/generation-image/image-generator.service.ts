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
    
    // Используем Imagen 3 - она самая стабильная для Image-to-Image сейчас
    private readonly endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-002`;

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
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (error) {
            throw new Error(`Не удалось загрузить исходное изображение: ${error.message}`);
        }
    }

    async generate(dto: GenerateImageDto, userId: string) {
        console.log(`[Imagen] Запуск для пользователя: ${userId}`);

        // СТРУКТУРА ДЛЯ IMAGE-TO-IMAGE
        const instancePayload: any = {
            prompt: dto.prompt,
        };

        const parametersPayload: any = {
            sampleCount: 1,
            // Добавляем параметры безопасности, чтобы не ловить пустые ответы
            safetySetting: "block_few", 
            personGeneration: "allow_all"
        };

        if (dto.image) {
            const base64Source = await this.getBase64FromUrl(dto.image);
            // Для Imagen 3/4 референс передается так:
            instancePayload.image = {
                bytesBase64Encoded: base64Source
            };
            // ОБЯЗАТЕЛЬНО: при наличии image нельзя передавать aspectRatio
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
                throw new Error('Модель отклонила запрос (возможно, контент не прошел фильтр безопасности)');
            }

            const result: any = helpers.fromValue(response.predictions[0] as any);
            
            // У некоторых версий моделей ответ лежит в 'bytesBase64Encoded', у других в 'image'
            const base64Image = result.bytesBase64Encoded || result.image;

            if (!base64Image) {
                throw new Error('В ответе модели отсутствует изображение');
            }

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
                    model: 'imagen-3.0'
                }
            };
        } catch (error) {
            console.error('Ошибка Imagen API:', error);
            throw new Error(`Ошибка генерации: ${error.details || error.message}`);
        }
    }
}