import { Module } from '@nestjs/common';
import { AvatarGeneratorService } from './generate-avatar.service';
import { AvatarGeneratorController } from './generate-avatar.controller';
import { FilesModule } from 'src/Modules/file/file.module';
import { TokenBalanceModule } from '../../Modules/token-balance/token-balance.module';
import { User } from '../../Entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [FilesModule, TokenBalanceModule, TypeOrmModule.forFeature([User])],
  controllers: [AvatarGeneratorController],
  providers: [AvatarGeneratorService],
  exports: [AvatarGeneratorService],
})
export class AvatarGeneratorModule {}