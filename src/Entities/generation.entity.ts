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
  PHOTO_BY_STAGE = 'photo_by_state',
  PHOTO_BY_REFERENCE = 'photo_by_reference',
  PHOTO_ANIMATION = 'photo_animation',
  LIP_SYNC = 'lip_sync',
  WOMEN_STYLE = 'women_style',
  MEN_STYLE = 'men_style',
  NANO_BANANA = 'nano_banana',
  NANO_BANANA_PRO = 'nano_banana_pro',
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

  @Column()
  imageURL: string;

  @Column({ nullable: true })
  externalTaskId: string;

  @OneToMany(() => GenerationMedia, (media) => media.generation)
  media: GenerationMedia[];

  @CreateDateColumn()
  createdAt: Date;
}
