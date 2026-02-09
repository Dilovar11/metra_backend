import { ApiProperty } from '@nestjs/swagger';
// Не забудьте экспортировать SceneMode из файла сущности
import { SceneType, SceneMode } from '../../../Entities/scene.entity';

export class CreateSceneDto {
    @ApiProperty({
        enum: SceneMode,
        enumName: 'SceneMode',
        description: 'Режим сцены: Шаблон или Свободный стиль',
        example: SceneMode.TEMPLATE
    })
    mode: SceneMode;

    @ApiProperty({
        enum: SceneType,
        enumName: 'SceneType',
        description: 'Выберите категорию контента',
        example: SceneType.HOME_PORTRAIT 
    })
    type: SceneType;

    @ApiProperty({ 
        example: 'Уютный вечер у камина',
        description: 'Название сцены' 
    })
    name: string;

    @ApiProperty({ 
        example: 'High quality portrait, cinematic lighting, cozy atmosphere...',
        description: 'Промпт для генерации'
    })
    prompt: string;
}