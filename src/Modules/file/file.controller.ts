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
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { TgUser } from 'src/Common/decorators/user.decorator';

@ApiTags('Загрузка файлов (images) на сервере cloudinary')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }
  
  @Post('avatar') // Убрали /:userId
  @ApiOperation({ summary: 'Сохранение файлов фото пользователя для генерации аватаров' })
  @ApiConsumes('multipart/form-data')
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
    @TgUser('id') userId: number // Берем проверенный ID здесь!
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return await this.filesService.saveFileAvatar(files, userId.toString());
  }

  @Post('generated-avatar') // Убрали /:userId
  @ApiOperation({ summary: 'Сохранение файлов выбранных аватаров' })
  @ApiConsumes('multipart/form-data')
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
    @TgUser('id') userId: number
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return await this.filesService.saveFileGeneratedAvatars(files, userId.toString());
  }

  @Post('generated-avatar/:index') // Оставили только index
  @ApiOperation({ summary: 'Сохранение файла выбранного аватара под конкретным индексом' })
  @ApiConsumes('multipart/form-data')
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
    @TgUser('id') userId: number,
    @Param('index') index: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const numericIndex = parseInt(index, 10);
    if (isNaN(numericIndex)) {
      throw new BadRequestException('Index must be a number');
    }

    return await this.filesService.saveFileGeneratedAvatarByIndex(file, userId.toString(), numericIndex);
  }

  @Post('save-for-generation') // Убрали /:userId
  @ApiOperation({ summary: 'Сохранение изображения пользователя для генерации' })
  @ApiConsumes('multipart/form-data')
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
    @TgUser('id') userId: number
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return await this.filesService.saveFileImage(file, userId.toString());
  }
}