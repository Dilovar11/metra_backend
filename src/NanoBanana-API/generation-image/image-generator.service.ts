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
        console.log(`[Imagen 3] Обработка запроса для пользователя: ${userId}`);

        // 1. Формируем тело запроса (instance)
        const instancePayload: any = {
            prompt: dto.prompt,
        };

        // 2. Параметры генерации
        const parametersPayload: any = {
            sampleCount: 1,
            aspectRatio: "1:1",
            addWatermark: false,
            personGeneration: "allow_all", // Разрешаем генерацию людей
        };

        // 3. Если пользователь прислал фото — настраиваем Image-to-Image
        if (dto.image) {
            console.log(`[Imagen 3] Обнаружено исходное фото. Режим: Image-to-Image`);
            const base64Source = await this.getBase64FromUrl(dto.image);
            
            instancePayload.image = {
                bytesBase64Encoded: base64Source,
                mimeType: "image/jpeg"
            };

            // Параметр влияния промпта на оригинал. 
            // 0.4–0.6 — золотая середина (сохраняет композицию, но меняет стиль).
            parametersPayload.imagePromptWeight = 0.5; 
            
            // Когда есть входное фото, aspectRatio должен совпадать с оригиналом или отсутствовать
            delete parametersPayload.aspectRatio; 
        }

        try {
            // Превращаем JS-объекты в формат Protobuf Value для Google SDK
            const instanceValue = helpers.toValue(instancePayload) as any;
            const parameterValue = helpers.toValue(parametersPayload) as any;

            const [response] = await this.client.predict({
                endpoint: this.endpoint,
                instances: [instanceValue],
                parameters: parameterValue,
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

    /**
     * Загрузка изображения по ссылке и перевод в Base64
     */
    private async getBase64FromUrl(url: string): Promise<string> {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (error) {
            throw new Error(`Не удалось загрузить исходное изображение по ссылке: ${error.message}`);
        }
    }
}