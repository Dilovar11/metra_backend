import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Generation } from './generation.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('generation_media')
export class GenerationMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Generation, (g) => g.media, { onDelete: 'CASCADE' })
  generation: Generation;

  @Column()
  mediaUrl: string;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  mediaType: MediaType;
}
