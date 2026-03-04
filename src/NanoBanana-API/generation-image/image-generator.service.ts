import { Injectable } from '@nestjs/common';
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import { VertexAI } from '@google-cloud/vertexai'; // Нужно установить: npm install @google-cloud/vertexai
import { FilesService } from '../../Modules/file/file.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import axios from 'axios';

@Injectable()
export class ImageGeneratorService {
    private client: PredictionServiceClient;
    private vertexAI: VertexAI;

    private readonly project = process.env.GOOGLE_PROJECT_ID;
    private readonly location = process.env.GOOGLE_LOCATION || 'us-central1';

    // Эндпоинты
    private readonly fastModel = `projects/${this.project}/locations/${this.location}/publishers/google/models/imagen-3.0-fast-generate-001`;
    private readonly geminiModelId = 'gemini-3.1-flash-image-preview'; // Nano Banana 2

    constructor(private readonly filesService: FilesService) {
        const credentialsJson = process.env.GOOGLE_CREDS_JSON;
        let credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;

        // Для Imagen Fast
        this.client = new PredictionServiceClient({
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
            credentials,
            projectId: this.project,
        });

        // Для Gemini 3.1
        this.vertexAI = new VertexAI({
            project: this.project,
            location: this.location,
            googleAuthOptions: { credentials }
        });
    }

    async generate(dto: GenerateImageDto, userId: string) {
        if (dto.image) {
            // --- РЕЖИМ GEMINI 3.1 FLASH IMAGE (Nano Banana 2) ---
            console.log(`[Nano Banana 2] Использование Gemini 3.1 для: ${userId}`);
            return this.generateWithGemini(dto, userId);
        } else {
            // --- РЕЖИМ IMAGEN 3 FAST (Только текст) ---
            console.log(`[Imagen 3] Режим Fast для: ${userId}`);
            return this.generateWithFast(dto, userId);
        }
    }

    private async generateWithGemini(dto: GenerateImageDto, userId: string) {
        const model = this.vertexAI.getGenerativeModel({ model: this.geminiModelId });
        const base64Source = await this.getBase64FromUrl(dto.image!);

        // Явно указываем тип или используем any для обхода строгой проверки TS
        const request: any = {
            contents: [{
                role: 'user',
                parts: [
                    { text: dto.prompt },
                    {
                        inlineData: {
                            data: base64Source,
                            mimeType: 'image/jpeg'
                        }
                    }
                ]
            }],
            generationConfig: {
                // Эти параметры валидны для 3.1 Flash Image, но отсутствуют в базовом GenerationConfig TS
                sampleCount: 1,
                aspectRatio: "1:1",
                // Можно добавить качество, если нужно
                quality: "hd"
            }
        };

        try {
            const result = await model.generateContent(request);
            const response = result.response;

            // В Gemini 3.1 ответ с картинкой приходит в поле candidates[0].content.parts
            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) throw new Error('Нет кандидатов в ответе');

            const imagePart = candidates[0].content.parts.find(part => part.inlineData);

            if (!imagePart || !imagePart.inlineData) {
                throw new Error('Gemini не вернула изображение. Проверьте промпт на соответствие политике безопасности.');
            }

            const base64Image = imagePart.inlineData.data;
            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: {
                    model: this.geminiModelId,
                    engine: 'Nano Banana 2',
                    cost: '~$0.06'
                }
            };
        } catch (error) {
            console.error('Ошибка Gemini 3.1:', error.message);
            throw new Error(`Ошибка Gemini: ${error.message}`);
        }
    }

    private async generateWithFast(dto: GenerateImageDto, userId: string) {
        const instancePayload = { prompt: dto.prompt };
        const parametersPayload = {
            sampleCount: 1,
            aspectRatio: "1:1",
            personGeneration: "allow_all",
            safetySetting: "block_few",
            addWatermark: false
        };

        try {
            const [response] = await this.client.predict({
                endpoint: this.fastModel,
                instances: [helpers.toValue(instancePayload) as any],
                parameters: helpers.toValue(parametersPayload) as any,
            });

            const result: any = helpers.fromValue(response.predictions![0] as any);
            const base64Image = result.bytesBase64Encoded || result.image;

            const savedFile = await this.filesService.saveAiGeneratedImage(base64Image, userId);

            return {
                status: 'success',
                processedImage: savedFile.url,
                metadata: { model: 'imagen-3.0-fast', cost: '$0.02' }
            };
        } catch (error) {
            throw new Error(`Ошибка Fast генерации: ${error.message}`);
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