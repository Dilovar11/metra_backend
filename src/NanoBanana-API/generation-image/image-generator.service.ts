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
    
    // Эндпоинты для разных задач
    private readonly capabilityModel = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-capability-001`;
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
            // --- РЕЖИМ С ИЗОБРАЖЕНИЕМ (Image-to-Image) ---
            console.log(`[Imagen 3] Режим Capability (с фото) для: ${userId}`);
            endpoint = this.capabilityModel;

            const base64Source = await this.getBase64FromUrl(dto.image);

            instancePayload = {
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

            parametersPayload = {
                sampleCount: 1,
                editMode: "EDIT_MODE_INPAINT_INSERTION",
                personGeneration: "allow_all",
                safetySetting: "block_few",
                addWatermark: false
            };
        } else {
            // --- РЕЖИМ БЕЗ ИЗОБРАЖЕНИЯ (Text-to-Image) ---
            console.log(`[Imagen 3] Режим Fast (только текст) для: ${userId}`);
            endpoint = this.fastModel;

            instancePayload = {
                prompt: dto.prompt
            };

            parametersPayload = {
                sampleCount: 1,
                aspectRatio: "1:1", // Fast модель поддерживает выбор соотношения сторон
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
                throw new Error('Модель не вернула результат. Проверьте фильтры безопасности.');
            }

            const result: any = helpers.fromValue(response.predictions[0] as any);
            // У разных моделей ключ может называться bytesBase64Encoded или image
            const base64Image = result.bytesBase64Encoded || result.image;

            if (!base64Image) {
                throw new Error('Данные изображения отсутствуют в ответе.');
            }

            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { 
                    model: dto.image ? 'imagen-3.0-capability' : 'imagen-3.0-fast',
                    cost: dto.image ? '$0.04' : '$0.02' // Примерная стоимость
                }
            };
        } catch (error) {
            console.error('Ошибка генерации:', error.details || error.message);
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