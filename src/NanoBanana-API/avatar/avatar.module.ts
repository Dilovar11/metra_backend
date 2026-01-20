import { Module } from '@nestjs/common';
import { AvatarGeneratorService } from './generate-avatar.service';
import { AvatarController } from './avatar.controller';

@Module({
  controllers: [AvatarController],
  providers: [AvatarGeneratorService],
  exports: [AvatarGeneratorService],
})
export class AvatarModule {}