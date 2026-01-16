import { Module } from '@nestjs/common';
import { NanoBananaController } from './nanobanana.controller';
import { NanoBananaService } from './nanobanana.service';

@Module({
  controllers: [NanoBananaController],
  providers: [NanoBananaService],
})
export class NanoBananaModule {}
