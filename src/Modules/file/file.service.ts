import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  saveFiles(files: Array<Express.Multer.File>) {
    return files.map(file => {
      // Multer сам сохранит файл
      return {
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/${file.filename}`
      };
    });
  }
}