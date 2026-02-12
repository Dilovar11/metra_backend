import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SceneCategory } from './scene-category.entity';

export enum SceneMode {
    TEMPLATE = 'Template',
    FREE_STYLE = 'FreeStyle',
}

@Entity('scenes')
export class Scene {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: SceneMode,
        default: SceneMode.TEMPLATE
    })
    mode: SceneMode;

    @ManyToOne(() => SceneCategory, (category) => category.scenes, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'categoryId' })
    category: SceneCategory;

    @Column()
    name: string;

    @Column()
    image: string;

    @Column({ type: 'text' })
    prompt: string;

    @CreateDateColumn()
    createdAt: Date;
}