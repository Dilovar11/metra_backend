import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Generation, GenerationType } from '../../Entities/generation.entity';
import { User } from '../../Entities/user.entity';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationService {
  constructor(
    @InjectRepository(Generation)
    private generationRepo: Repository<Generation>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

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

  findByUserAndType(userId: string, type?: GenerationType) {
    const whereOptions: any = { user: { id: userId } };

    if (type) {
      whereOptions.type = type;
    }

    return this.generationRepo.find({
      where: whereOptions,
      relations: ['media'],
    });
  } 

}
