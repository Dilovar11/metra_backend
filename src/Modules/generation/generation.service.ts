import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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

  async findAll(filter: 'all' | 'photo' | 'video' = 'all') {

    const CategoryNames: Record<GenerationType, string> = {
      [GenerationType.PHOTO_BY_STAGE]: 'Фото по сцене',
      [GenerationType.PHOTO_BY_REFERENCE]: 'Фото по референсу (Image to Image)',
      [GenerationType.PHOTO_ANIMATION]: 'Оживление фото',
      [GenerationType.LIP_SYNC]: 'LipSync',
      [GenerationType.WOMEN_STYLE]: 'Женский стиль',
      [GenerationType.MEN_STYLE]: 'Мужской стиль',
      [GenerationType.NANO_BANANA]: 'Nano Banana',
      [GenerationType.NANO_BANANA_PRO]: 'Nano Banana PRO',
    };
    const videoTypes = [GenerationType.PHOTO_ANIMATION, GenerationType.LIP_SYNC];

    const findOptions: any = {
      relations: ['user', 'media'],
      order: { createdAt: 'DESC' },
      where: {},
    };

    if (filter === 'video') {
      findOptions.where.type = In(videoTypes);
    } else if (filter === 'photo') {
      findOptions.where.type = Not(In(videoTypes));
    }
    const generations = await this.generationRepo.find(findOptions);

    return generations.map(gen => ({
      ...gen,
      category: CategoryNames[gen.type] || 'Неизвестная категория'
    }));
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
