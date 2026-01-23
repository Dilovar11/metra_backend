import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  BadRequestException 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
    FilesInterceptor('files', 10, { // 'files' - имя ключа, 10 - макс. количество
      storage: diskStorage({
        destination: './uploads', 
        filename: (req, file, callback) => {
          // Генерируем уникальное имя: timestamp + рандом + расширение
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  uploadMultipleFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.filesService.saveFiles(files);
  }
}