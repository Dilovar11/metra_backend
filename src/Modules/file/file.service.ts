// file.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as toStream from 'buffer-to-stream';

@Injectable()
export class FilesService {
  constructor() {
    // Рекомендую вынести это в .env
    cloudinary.config({
      cloud_name: 'dncehtdoz', 
      api_key: '684895585518196',
      api_secret: '2Tmko7KRqC4ioUHKIJvecAekvQk',
    });
  }

  async uploadToCloudinary(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream((error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      // Превращаем буфер файла в поток и отправляем в Cloudinary
      toStream(file.buffer).pipe(upload);
    });
  }

  async saveFiles(files: Array<Express.Multer.File>) {
    const uploadPromises = files.map(file => this.uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);

    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url, // Ссылка на файл в облаке
    }));
  }
}