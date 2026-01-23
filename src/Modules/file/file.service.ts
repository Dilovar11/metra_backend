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

  async uploadToCloudinary(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'metra_uploads', // Можно указать папку в Cloudinary
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

  async saveFiles(files: Array<Express.Multer.File>) {
    const uploadPromises = files.map((file) => this.uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);

    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url,
    }));
  }
}