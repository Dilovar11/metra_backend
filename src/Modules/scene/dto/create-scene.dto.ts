import { ApiProperty } from '@nestjs/swagger';
import { SceneType } from '../../../Entities/scene.entity';

export class CreateSceneDto {
    // Именно эта строка создает выпадающий список
    @ApiProperty({
        enum: SceneType,
        enumName: 'SceneType',
        description: 'Выберите тип сцены из списка',
        example: SceneType.HOME_PORTRAIT // подсказка для Swagger
    })
    type: SceneType;

    @ApiProperty({ example: 'Уютный вечер у камина' })
    name: string;

    @ApiProperty({ example: 'High quality portrait, cinematic lighting, cozy atmosphere...' })
    prompt: string;
}