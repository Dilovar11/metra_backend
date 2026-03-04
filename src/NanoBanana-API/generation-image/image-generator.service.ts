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

    // СТАБИЛЬНЫЕ ЭНДПОИНТЫ (по документации Google)
    private readonly generateModel = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-002`;
    private readonly fastModel = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-fast-generate-001`;

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
        let endpoint: string;
        let instancePayload: any;
        let parametersPayload: any;

        if (dto.image) {
            // --- СТАБИЛЬНЫЙ РЕЖИМ РЕМОНТА (Image-to-Image) ---
            console.log(`[Nano Banana] Стабильный Imagen 3 Generate для: ${userId}`);
            endpoint = this.generateModel;

            const base64Source = await this.getBase64FromUrl(dto.image);

            // СТРОГО ПО ДОКУМЕНТАЦИИ:
            instancePayload = {
                prompt: dto.prompt,
                image: {
                    bytesBase64Encoded: base64Source
                }
            };

            parametersPayload = {
                sampleCount: 1,
                // imagePromptWeight: 
                // 0.4-0.5 — сохраняет структуру дома, но меняет отделку на "элиту"
                // 0.8+ — нарисует вообще другой дом.
                imagePromptWeight: 0.5, 
                personGeneration: "allow_all",
                safetySetting: "block_few",
                addWatermark: false
            };
        } else {
            // --- РЕЖИМ ТОЛЬКО ТЕКСТ (Fast) ---
            console.log(`[Imagen 3] Режим Fast для: ${userId}`);
            endpoint = this.fastModel;

            instancePayload = { prompt: dto.prompt };
            parametersPayload = {
                sampleCount: 1,
                aspectRatio: "1:1",
                personGeneration: "allow_all",
                safetySetting: "block_few",
                addWatermark: false
            };
        }

        try {
            const [response] = await this.client.predict({
                endpoint: endpoint,
                instances: [helpers.toValue(instancePayload) as any],
                parameters: helpers.toValue(parametersPayload) as any,
            });

            if (!response.predictions || response.predictions.length === 0) {
                throw new Error('Модель заблокировала результат по соображениям безопасности.');
            }

            const result: any = helpers.fromValue(response.predictions[0] as any);
            // В 002 модели ответ всегда приходит в bytesBase64Encoded
            const base64Image = result.bytesBase64Encoded;

            if (!base64Image) {
                throw new Error('Ошибка: в ответе нет данных изображения.');
            }

            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { 
                    model: dto.image ? 'imagen-3.0-generate' : 'imagen-3.0-fast'
                }
            };
        } catch (error) {
            console.error('Vertex AI Error:', error.details || error.message);
            throw new Error(`Ошибка генерации: ${error.details || error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const optimizedUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/w_1024,c_limit,f_jpg/')
            : url;

        const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}