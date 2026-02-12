import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Scene } from './scene.entity';

@Entity('scene_categories') // Название таблицы в БД
export class SceneCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string; // Название (например, 'Домашний портрет')

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    image: string;

    @Column({ type: 'text' })
    description: string;

    @OneToMany(() => Scene, (scene) => scene.category)
    scenes: Scene[];
}