import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { GenerationMedia } from './generation-media.entity';

export enum GenerationType {
  NANO_BANANA = 'nano_banana',
  NANO_BANANA_PRO = 'nano_banana_pro',
  PHOTO_STUDIO = 'photo_studio',
  TRY_ON = 'try_on',
  VIDEO = 'video',
}

@Entity('generations')
export class Generation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'enum', enum: GenerationType })
  type: GenerationType;

  @Column({ nullable: true })
  prompt: string;

  @Column({ nullable: true })
  externalTaskId: string;

  @OneToMany(() => GenerationMedia, (media) => media.generation)
  media: GenerationMedia[];

  @CreateDateColumn()
  createdAt: Date;
}
