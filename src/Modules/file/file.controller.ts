// file.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  BadRequestException,
  Param
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './file.service';
import { ApiTags, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Загрузка файлов (images) на cloudinary')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('avatar/:userId') // Добавляем userId в путь
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
    @Param('userId') userId: string // Получаем userId из URL
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    
    // Передаем массив файлов и userId в сервис
    return await this.filesService.saveFileAvatar(files, userId);
  }
}