import { Module } from '@nestjs/common';
import { AvatarGeneratorService } from './generate-avatar.service';
import { AvatarGeneratorController } from './generate-avatar.controller';
import { FilesModule } from 'src/Modules/file/file.module';

@Module({
  imports: [FilesModule],
  controllers: [AvatarGeneratorController],
  providers: [AvatarGeneratorService],
  exports: [AvatarGeneratorService],
})
export class AvatarGeneratorModule {}