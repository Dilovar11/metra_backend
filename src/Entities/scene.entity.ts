import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum SceneType {
    HOME_PORTRAIT = 'Домашний портрет',
    STUDIO_LOOK = 'Студийный образ',
    CITY_EVENING = 'Городской вечер',
    WINTER_LOOK = 'Зимний образ',
    PROFILE_AVATAR = 'Профиль / Аватар',
    COUPLE_DUO = 'Пара / Duo',
}

@Entity('scenes')
export class Scene {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: SceneType,
    })
    type: SceneType;

    @Column()
    name: string;

    @Column({ type: 'text' })
    prompt: string;

    @CreateDateColumn()
    createdAt: Date;
}