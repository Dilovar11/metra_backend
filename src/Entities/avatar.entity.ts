import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './user.entity';

@Entity('avatars')
export class Avatar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  activeAvatar: string;

  @Column()
  gender: string;

  @Column("text", { array: true, default: '{}' })
  imagesURL: string[];

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  setDefaultActiveAvatar() {
    if (this.imagesURL && this.imagesURL.length > 0 && !this.activeAvatar) {
      this.activeAvatar = this.imagesURL[0];
    }
  }

  @BeforeUpdate()
  updateDefaultActiveAvatar() {
    if (this.imagesURL && this.imagesURL.length > 0 && !this.activeAvatar) {
      this.activeAvatar = this.imagesURL[0];
    }
  }
}
