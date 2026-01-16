import axios from 'axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class NanoBananaService {
    private readonly apiKey = process.env.NANOBANANA_API_KEY;
    private readonly baseUrl = process.env.NANOBANANA_BASE_URL;

    private headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
    };

    async generate(prompt: string, numImages = 1) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/generate`,
                {
                    prompt,
                    type: 'TEXTTOIAMGE',
                    numImages,
                    callBackUrl: '',
                },
                {
                    headers: this.headers,
                    timeout: 30000,
                },
            );

            const api = response.data;

            // ✅ 1. СНАЧАЛА проверяем код API
            if (api?.code === 402) {
                throw new HttpException(
                    {
                        error: 'Insufficient credits',
                        message: api.msg || 'Баланс NanoBanana = 0',
                    },
                    402,
                );
            }

            if (api?.code !== 200) {
                throw new HttpException(
                    {
                        error: 'NanoBanana API error',
                        message: api?.msg || 'Unknown API error',
                        raw: api,
                    },
                    HttpStatus.BAD_GATEWAY,
                );
            }

            // ✅ 2. ТОЛЬКО ПОТОМ проверяем taskId
            if (!api.data?.taskId) {
                throw new HttpException(
                    {
                        error: 'taskId not found',
                        raw: api,
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return {
                data: {
                    taskId: api.data.taskId,
                },
            };
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }

            const raw =
                error?.response?.data ||
                error?.message ||
                'Unknown error';

            console.error('NanoBanana ERROR:', raw);

            throw new HttpException(
                {
                    error: 'Request failed',
                    message: raw,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }




    async status(taskId: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/record-info`,
                {
                    headers: this.headers,
                    params: { taskId },
                },
            );

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new HttpException(
                {
                    error: 'Status request failed',
                    message: error?.response?.data || error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
