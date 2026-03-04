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
    
    // ВАЖНО: Используем модель capability для редактирования
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
        // 1. Подготовка инстанса согласно документации
        const instance: any = {
            prompt: dto.prompt,
        };

        const parameters: any = {
            sampleCount: 1,
            // Для Imagen 3 capability обязательно указываем режим
            // Если мы просто хотим изменить фото по промпту, используем INPAINT_INSERTION
            // без маски он будет пытаться гармонично изменить всё фото
            editMode: "EDIT_MODE_INPAINT_INSERTION", 
        };

        if (dto.image) {
            const base64Source = await this.getBase64FromUrl(dto.image);
            
            // НОВАЯ СТРУКТУРА: referenceImages вместо просто image
            instance.referenceImages = [
                {
                    referenceId: 1,
                    referenceType: "REFERENCE_TYPE_RAW",
                    referenceImage: {
                        bytesBase64Encoded: base64Source
                    }
                }
            ];
        } else {
            // Если картинки нет, этот сервис (capability) может не сработать.
            // Для обычной генерации лучше оставить прошлый эндпоинт imagen-3.0-generate-001
            throw new Error("Эта модель предназначена только для редактирования существующих фото.");
        }

        try {
            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [helpers.toValue(instance) as any],
                parameters: helpers.toValue(parameters) as any,
            });

            const result: any = helpers.fromValue(response.predictions[0] as any);
            const base64Image = result.bytesBase64Encoded;

            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { model: 'imagen-3.0-capability' }
            };
        } catch (error) {
            console.error('Ошибка согласно докам:', error.details || error.message);
            throw new Error(`Ошибка генерации: ${error.details || error.message}`);
        }
    }

    private async getBase64FromUrl(url: string): Promise<string> {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    }
}