import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Generation } from '../../Entities/generation.entity';
import { User } from '../../Entities/user.entity';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationService {
  constructor(
    @InjectRepository(Generation)
    private generationRepo: Repository<Generation>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateGenerationDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const generation = this.generationRepo.create({
      user,
      type: dto.type,
      prompt: dto.prompt,
      imageURL: dto.imageURL,
      externalTaskId: dto.externalTaskId
    });

    return this.generationRepo.save(generation);
  }

  findAll() {
    return this.generationRepo.find({
      relations: ['user', 'media'],
      order: { createdAt: 'DESC' },
    });
  }

  findByUser(userId: string) {
    return this.generationRepo.find({
      where: { user: { id: userId } },
      relations: ['media'],
    });
  }
}
