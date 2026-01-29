// create-scene.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { SceneType } from '../../../Entities/scene.entity';

export class CreateSceneDto {
    @ApiProperty({ enum: SceneType }) 
    type: SceneType;

    @ApiProperty({ example: 'Уютный вечер у камина' })
    name: string;

    @ApiProperty({ example: 'High quality portrait...' })
    prompt: string;
}