import { Module } from '@nestjs/common';
import { AvatarGeneratorService } from './generate-avatar.service';
import { AvatarGeneratorController } from './generate-avatar.controller';

@Module({
  controllers: [AvatarGeneratorController],
  providers: [AvatarGeneratorService],
  exports: [AvatarGeneratorService],
})
export class AvatarGeneratorModule {}