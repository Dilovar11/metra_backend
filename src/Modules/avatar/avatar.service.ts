import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from '../../Entities/avatar.entity';
import { User } from '../../Entities/user.entity';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Injectable()
export class AvatarService {
  constructor(
    @InjectRepository(Avatar)
    private avatarRepository: Repository<Avatar>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(dto: CreateAvatarDto): Promise<Avatar> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const avatar = this.avatarRepository.create({
      user,
      gender: dto.gender,
      imageFront: dto.imageFront,
      imageLeft: dto.imageLeft,
      imageRight: dto.imageRight,
    });

    return this.avatarRepository.save(avatar);
  }

  findAll(): Promise<Avatar[]> {
    return this.avatarRepository.find({
      relations: ['user'],
    });
  }

  findByUser(userId: string): Promise<Avatar | null> {
    return this.avatarRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: string, dto: UpdateAvatarDto): Promise<Avatar | null> {
    await this.avatarRepository.update(id, dto);
    return this.avatarRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.avatarRepository.delete(id);
  }
}
