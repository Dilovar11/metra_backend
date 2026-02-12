import { ApiProperty } from '@nestjs/swagger';
import { SceneMode } from '../../../Entities/scene.entity';

export class CreateSceneDto {
    @ApiProperty({
        enum: SceneMode,
        description: 'Режим сцены: Шаблон или Свободный стиль',
        example: SceneMode.TEMPLATE
    })
    mode: SceneMode;

    @ApiProperty({
        example: 1,
        description: 'ID категории из таблицы SceneCategory'
    })
    categoryId: number; // Теперь передаем ID числом

    @ApiProperty({
        example: 'Уютный вечер у камина',
        description: 'Название сцены'
    })
    name: string;

    @ApiProperty({
        example: 'Мягкий свет, уют, естественность',
        description: 'Описание сцены'
    })
    description: string;

    @ApiProperty({
        example: 'High quality portrait, cinematic lighting...',
        description: 'Промпт для генерации'
    })
    prompt: string;
}

