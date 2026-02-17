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
                
                const successImageUrl1 = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmgtePIhM5sWc96KUjIIZYYtLkyDcUH13hOA&s';
                const successImageUrl2 = 'https://cdn-icons-png.flaticon.com/512/11122/11122443.png';
                const successImageUrl3 = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTymEBwTy4adePMBn4Zln-smukrUFsI8FyDnA&s';
                const successImageUrl4 = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP9Sbu9iUE6UPNtmd9E6L8AZSX2Vo6hmkI4w&s';

                console.log('--- Mock Generation Finished Successfully --');
                
                return {
                    name: dto.name,
                    gender: dto.gender, 
                    imagesURL: [
                        successImageUrl1,
                        successImageUrl2,
                        successImageUrl3,
                        successImageUrl4
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