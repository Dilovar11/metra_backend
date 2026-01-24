import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  constructor() {
    cloudinary.config({
      cloud_name: 'dncehtdoz',
      api_key: '684895585518196',
      api_secret: '2Tmko7KRqC4ioUHKIJvecAekvQk',
    });
  }

  async uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder, 
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      // Создаем поток из буфера файла напрямую через встроенный Readable
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null); // Сигнализируем о конце потока
      stream.pipe(uploadStream);
    });
  }

  async saveFileAvatar(files: Array<Express.Multer.File>) {
    const uploadPromises = files.map((file) => this.uploadToCloudinary(file, 'metra_avatars'));
    const results = await Promise.all(uploadPromises);

    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url,
    }));
  }
}