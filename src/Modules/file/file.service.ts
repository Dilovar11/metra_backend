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

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
    customFileName: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: customFileName,
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  async saveFileAvatar(files: Array<Express.Multer.File>, userId: string) {
    const userFolder = `metra_files_for_avatars`;
    const uploadPromises = files.map((file, index) => {
      const customFileName = `${userId}${index}`;
      return this.uploadToCloudinary(file, userFolder, customFileName);
    });

    const results = await Promise.all(uploadPromises);

    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url,
    }));
  }


  async saveFileGeneratedAvatars(files: Array<Express.Multer.File>, userId: string) {
    const userFolder = `metra_avatars/${userId}`;
    const uploadPromises = files.map((file, index) => {
      const customFileName = `${userId}${index}`;
      return this.uploadToCloudinary(file, userFolder, customFileName);
    });

    const results = await Promise.all(uploadPromises);

    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url,
    }));
  }


  async saveFileGeneratedAvatarByIndex(file: Express.Multer.File, userId: string, index: number) {

    const userFolder = `metra_avatars/${userId}`;
    const customFileName = `${userId}${index}`;

    try {
      const result = await this.uploadToCloudinary(file, userFolder, customFileName);
      return {
        originalName: file.originalname,
        filename: result.public_id,
        url: result.secure_url,
        index: index
      };
    } catch (error) {
      throw new Error(`Ошибка загрузки файла под индексом ${index}: ${error.message}`);
    }
  }
}