import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GenerateAvatarDto } from './dto/generate-avatar.dto';

@Injectable()
export class AvatarGeneratorService {
    async generateAvatar(dto: GenerateAvatarDto): Promise<any> {
        console.log('--- Mock URL Generation Started ---');
        console.log('Received DTO:', dto);

        try {
            await new Promise(resolve => setTimeout(resolve, 1));

            if (dto.name && dto.gender && dto.imageFront && dto.imageLeft && dto.imageRight) {
                
                const successImageUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmgtePIhM5sWc96KUjIIZYYtLkyDcUH13hOA&s';

                console.log('--- Mock Generation Finished Successfully ---');
                
                return {
                    name: dto.name,
                    gender: dto.gender, 
                    imagesURL: [
                        successImageUrl,
                        successImageUrl,
                        successImageUrl,
                        successImageUrl
                    ]
                };
            } else {
                console.log('Error: Missing required fields in DTO');
                return {
                    message: "Validation failed",
                    receivedData: dto
                };
            }

        } catch (error) {
            console.error('Mock Service Error:', error.message);
            throw new InternalServerErrorException('Ошибка на стороне тестового сервиса');
        }
    }
}