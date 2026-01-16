import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationMedia } from '../../Entities/generation-media.entity';
import { Generation } from '../../Entities/generation.entity';
import { CreateGenerationMediaDto } from './dto/create-generation-media.dto';

@Injectable()
export class GenerationMediaService {
  constructor(
    @InjectRepository(GenerationMedia)
    private mediaRepo: Repository<GenerationMedia>,

    @InjectRepository(Generation)
    private generationRepo: Repository<Generation>,
  ) {}

  async create(dto: CreateGenerationMediaDto) {
    const generation = await this.generationRepo.findOne({
      where: { id: dto.generationId },
    });

    if (!generation) {
      throw new NotFoundException('Generation not found');
    }

    const media = this.mediaRepo.create({
      generation,
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType,
    });

    return this.mediaRepo.save(media);
  }

  async findAll() {
    return this.mediaRepo.find({
      relations: ['generation'],
    });
  }

  async findByGeneration(generationId: string) {
    return this.mediaRepo.find({
      where: { generation: { id: generationId } },
      relations: ['generation'],
    });
  }
}
