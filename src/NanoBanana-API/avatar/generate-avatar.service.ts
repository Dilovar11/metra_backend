import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class AvatarGeneratorService {
    private readonly MOCK_IMAGES_PATH = join(process.cwd(), 'assets', 'test-images');

    async generateAvatar(dto: any): Promise<string[]> {
        console.log('--- Mock Generation Started ---');
        console.log('Received DTO:', dto);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const imageNames = ['1.png', '2.png', '3.png', '4.png'];
            
            const base64Images = await Promise.all(
                imageNames.map(async (fileName) => {
                    const filePath = join(this.MOCK_IMAGES_PATH, fileName);
                    
                    // Читаем файл в буфер
                    const fileBuffer = await fs.readFile(filePath);
                    
                    // Конвертируем в Base64 формат (Data URI)
                    return `data:image/png;base64,${fileBuffer.toString('base64')}`;
                })
            );

            console.log('--- Mock Generation Finished Successfully ---');
            return base64Images;

        } catch (error) {
            console.error('Mock Service Error:', error.message);
            // Если файлы не найдены или произошла ошибка
            throw new InternalServerErrorException(
                'Ошибка при чтении локальных тестовых изображений. Проверьте папку assets/test-images/'
            );
        }
    }
}