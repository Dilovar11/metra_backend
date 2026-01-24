// file.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  // ... конструктор с cloudinary.config как раньше

  private async uploadToCloudinary(
    file: Express.Multer.File, 
    folder: string, 
    customFileName: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,        // Директория: metra_avatars/userId
          public_id: customFileName, // Имя файла: d1dsr0
          overwrite: true,       // Перезаписывать, если файл с таким именем уже есть
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
}