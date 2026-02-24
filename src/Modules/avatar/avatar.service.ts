import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(userId: string, dto: CreateAvatarDto): Promise<Avatar> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.avatarRepository.delete({
      user: { id: userId },
    });

    const avatar = this.avatarRepository.create({
      user,
      name: dto.name,
      gender: dto.gender,
      imagesURL: dto.imagesURL,
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

  async addImgUrl(userId: string, newImageUrl: string): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!avatar) {
      throw new NotFoundException(`Avatar for user ${userId} not found`);
    }
    avatar.imagesURL = [...(avatar.imagesURL || []), newImageUrl];
    return await this.avatarRepository.save(avatar);
  }

  async remove(id: string): Promise<void> {
    await this.avatarRepository.delete(id);
  }

  async changeActiveAvatar(userId: string, newActiveUrl: string): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!avatar) {
      throw new NotFoundException('Аватар для данного пользователя не найден');
    }

    const hasImage = avatar.imagesURL.includes(newActiveUrl);

    if (!hasImage) {
      throw new BadRequestException('Данное изображение не найдено в списке загруженных аватаров');
    }

    avatar.activeAvatar = newActiveUrl;
    return await this.avatarRepository.save(avatar);
  }

}
