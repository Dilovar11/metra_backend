// file.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  BadRequestException 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './file.service';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Files')
@Controller('Files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('multiple')
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
      storage: memoryStorage(), // Используем память вместо диска
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadMultipleFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    // Вызываем асинхронную загрузку
    return await this.filesService.saveFiles(files);
  }
}