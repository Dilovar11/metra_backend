import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyPhoto } from '../../Entities/body-photo.entity';
import { User } from '../../Entities/user.entity';
import { BodyPhotoService } from './body-photo.service';
import { BodyPhotoController } from './body-photo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BodyPhoto, User])],
  providers: [BodyPhotoService],
  controllers: [BodyPhotoController],
})
export class BodyPhotoModule {}
