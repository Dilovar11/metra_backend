// file.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
  Param
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './file.service';
import { ApiTags, ApiConsumes, ApiBody, ApiParam, ApiOperation } from '@nestjs/swagger';

@ApiTags('Загрузка файлов (images) на сервере cloudinary')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('avatar/:userId')
  @ApiOperation({ summary: 'Сохранение файлов фото пользователя для генерации аватаров' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'userId', description: 'ID пользователя для создания папки и именования файлов' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFileAvatar(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('userId') userId: string
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return await this.filesService.saveFileAvatar(files, userId);
  }




  @Post('generated-avatar/:userId')
  @ApiOperation({ summary: 'Сохранение файлов выбранных аватаров' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'userId', description: 'ID пользователя для создания папки и именования файлов' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFileGeneratedAvatar(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('userId') userId: string
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return await this.filesService.saveFileGeneratedAvatars(files, userId);
  }



  @Post('generated-avatar/:userId/:index')
  @ApiOperation({ summary: 'Сохранение файла выбранного аватара под конкретным индексом' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  @ApiParam({ name: 'index', description: 'Индекс фото (0, 1, 2...)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadSingleFileByIndex(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
    @Param('index') index: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const numericIndex = parseInt(index, 10);
    if (isNaN(numericIndex)) {
      throw new BadRequestException('Index must be a number');
    }

    return await this.filesService.saveFileGeneratedAvatarByIndex(file, userId, numericIndex);
  }





  @Post('save-for-generation/:userId')
  @ApiOperation({ summary: 'Сохранение файла (изображение) пользователя для генерации' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'userId', description: 'ID пользователя для создания папки и именования файла' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { 
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { 
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFileForGeneration(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return await this.filesService.saveFileImage(file, userId);
  }





  @Post('save-generated/:userId')
  @ApiOperation({ summary: 'Загрузка сгенерированного изображения' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Разрешены только изображения!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadGenerated(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }
    return await this.filesService.saveGeneratedImage(file, userId);
  }
}