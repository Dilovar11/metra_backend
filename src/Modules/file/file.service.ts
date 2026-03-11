import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import sharp = require('sharp');

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
          resource_type: 'auto',
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

  // Категории сцен
  async saveFileSceneCategory(files: Array<Express.Multer.File>, fileName: string) {
    const userFolder = `metra_files_scene_category`;
    const uploadPromises = files.map((file) => {
      const customFileName = `${fileName}`;
      return this.uploadToCloudinary(file, userFolder, customFileName);
    });
    const results = await Promise.all(uploadPromises);
    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url,
    }));
  }

  // Сцены
  async saveFileScene(files: Array<Express.Multer.File>, fileName: string) {
    const userFolder = `metra_files_scene`;
    const uploadPromises = files.map((file) => {
      const customFileName = `${fileName}`;
      return this.uploadToCloudinary(file, userFolder, customFileName);
    });
    const results = await Promise.all(uploadPromises);
    return results.map((result, index) => ({
      originalName: files[index].originalname,
      filename: result.public_id,
      url: result.secure_url,
    }));
  }

  // Для аватара
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


  // Аватары
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


  // Аватар
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


  // Для генерации
  async saveFileImage(file: Express.Multer.File, userId: string) {
    const userFolder = `metra_files_for_generations/${userId}`;
    const customFileName = `${userId}`;
    const result = await this.uploadToCloudinary(file, userFolder, customFileName);
    return {
      originalName: file.originalname,
      filename: result.public_id,
      url: result.secure_url,
    };
  }


  // Генерированные изображении
  async saveGeneratedImage(file: Express.Multer.File, userId: string) {
    const userFolder = `metra_generations/${userId}`;

    const uniqueId = uuidv4();
    const customFileName = `$generated_${uniqueId}`;
    try {
      const result = await this.uploadToCloudinary(file, userFolder, customFileName);
      return {
        filename: result.public_id,
        url: result.secure_url,
        userId: userId
      };
    } catch (error) {
      throw new Error(`Ошибка загрузки уникального фото: ${error.message}`);
    }
  }


  // Удалить по id
  async deleteFromCloudinary(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return reject(new Error(`Ошибка удаления из Cloudinary: ${error.message}`));
        }
        resolve(result);
      });
    });
  }

  // Генерированные изображении
  async saveAiGeneratedImage(base64Data: string, userId: string) {
    const userFolder = `metra_generations/${userId}`;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const customFileName = `gen_${uniqueSuffix}`;
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const initialBuffer = Buffer.from(base64Image, 'base64');
    try {
      // --- ИЗМЕНЕНИЕ РАЗМЕРА ---
      const resizedBuffer = await sharp(initialBuffer)
        .resize(256, 256, {
          fit: 'cover',      // Заполнит квадрат 256x256, обрезая края если нужно
          position: 'center' // Центрирует изображение
        })
        .toBuffer();
      const fileMock = {
        buffer: resizedBuffer, // Используем измененный буфер
      } as Express.Multer.File;
      const result = await this.uploadToCloudinary(fileMock, userFolder, customFileName);
      return {
        filename: result.public_id,
        url: result.secure_url,
        userId: userId
      };
    } catch (error) {
      throw new Error(`Ошибка обработки или сохранения AI фото: ${error.message}`);
    }
  }

  // Метод для сохранения видео-анимации
  async saveAiGeneratedVideo(base64Data: string, userId: string) {
    const userFolder = `metra_generations/${userId}/animations`;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const customFileName = `anim_${uniqueSuffix}`;

    // Убираем префикс base64 (поддерживаем разные форматы видео)
    const base64Video = base64Data.replace(/^data:video\/\w+;base64,/, '');
    const videoBuffer = Buffer.from(base64Video, 'base64');

    try {
      const fileMock = {
        buffer: videoBuffer,
        mimetype: 'video/mp4', // Указываем, что это видео
      } as Express.Multer.File;

      const result = await this.uploadToCloudinary(fileMock, userFolder, customFileName);

      return {
        filename: result.public_id,
        url: result.secure_url,
        userId: userId
      };
    } catch (error) {
      throw new Error(`Ошибка сохранения AI видео: ${error.message}`);
    }
  }

}