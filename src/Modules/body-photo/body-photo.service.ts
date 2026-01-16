import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyPhoto } from '../../Entities/body-photo.entity';
import { User } from '../../Entities/user.entity';
import { CreateBodyPhotoDto } from './dto/create-body-photo.dto';

@Injectable()
export class BodyPhotoService {
  constructor(
    @InjectRepository(BodyPhoto)
    private bodyPhotoRepo: Repository<BodyPhoto>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateBodyPhotoDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const photo = this.bodyPhotoRepo.create({
      user,
      imageUrl: dto.imageUrl,
    });

    return this.bodyPhotoRepo.save(photo);
  }

  async findAll() {
    return this.bodyPhotoRepo.find({
      relations: ['user'],
    });
  }

  async findByUser(userId: string) {
    return this.bodyPhotoRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
