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
    
    // Используем ровно ту модель, которая сработала на скрине
    private readonly endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-capability-001`;

    constructor(private readonly filesService: FilesService) {
        const credentialsJson = process.env.GOOGLE_CREDS_JSON;
        let credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;

        this.client = new PredictionServiceClient({
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
            credentials,
            projectId: this.project,
        });
    }

    async generate(dto: GenerateImageDto, userId: string) {
        console.log(`[Imagen 3 Capability] Генерация по примеру консоли для: ${userId}`);

        // Скачиваем и оптимизируем фото сразу (чтобы не было проблем с размером)
        const base64Source = await this.getBase64FromUrl(dto.image!);

        // 1. Формируем структуру INSTANCE точно как в RawReferenceImage
        const instancePayload = {
            prompt: dto.prompt,
            referenceImages: [
                {
                    referenceId: 1,
                    referenceType: "REFERENCE_TYPE_RAW",
                    referenceImage: {
                        bytesBase64Encoded: base64Source
                    }
                }
            ]
        };

        // 2. Формируем PARAMETERS как на скрине
        const parametersPayload = {
            sampleCount: 1,
            // На скрине выбран режим улучшения, для capability это часто скрыто, 
            // но в API требует указания editMode или использования базовых параметров
            personGeneration: "allow_all",
            // Если оставить пустым или "block_few", как в Python коде
            safetySetting: "block_few",
            addWatermark: false
        };

        try {
            // ВАЖНО: Мы используем predict, но передаем структуру RawReferenceImage
            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [helpers.toValue(instancePayload) as any],
                parameters: helpers.toValue(parametersPayload) as any,
            });

            if (!response.predictions || response.predictions.length === 0) {
                throw new Error('Модель не вернула результат. Проверьте фильтры безопасности.');
            }

            const result: any = helpers.fromValue(response.predictions[0] as any);
            const base64Image = result.bytesBase64Encoded;

            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { model: 'imagen-3.0-capability-001' }
            };
        } catch (error) {
            console.error('Ошибка в стиле консоли Google:', error.details || error.message);
            throw new Error(`Ошибка генерации: ${error.details || error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        // Добавляем оптимизацию Cloudinary, чтобы гарантировать успех
        const optimizedUrl = url.includes('cloudinary.com') 
            ? url.replace('/upload/', '/upload/w_1024,c_limit,f_jpg/') 
            : url;
            
        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}