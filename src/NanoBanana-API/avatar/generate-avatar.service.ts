import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { GenerateAvatarDto } from './dto/generate-avatar.dto';

@Injectable()
export class AvatarGeneratorService {
    private readonly MOCK_IMAGES_PATH = join(process.cwd(), 'assets', 'test-images');

    async generateAvatar(dto: GenerateAvatarDto): Promise<any> {
        console.log('--- Mock Generation Started ---');
        console.log('Received DTO:', dto);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (dto.name && dto.gender && dto.imageFront && dto.imageLeft && dto.imageRight) {
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
                
                return {
                    name: dto.name,
                    gender: dto.gender, 
                    images: base64Images
                }
            }
            else {
                console.log('Error validation dto');
                return [];
            }

        } catch (error) {
            console.error('Mock Service Error:', error.message);
            // Если файлы не найдены или произошла ошибка
            throw new InternalServerErrorException(
                'Ошибка при чтении локальных тестовых изображений. Проверьте папку assets/test-images/'
            );
        }
    }
}