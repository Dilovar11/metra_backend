import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; 

export class RegisterDto {
    @ApiProperty({ description: 'ID пользователя в Telegram', example: '123456789' })
    @IsString()
    @IsNotEmpty()
    telegramId: string;

    @ApiProperty({ description: 'Никнейм пользователя', required: false, example: 'johndoe' })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ description: 'Имя', required: false, example: 'Иван' })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({ description: 'Фамилия', required: false, example: 'Иванов' })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({ 
        description: 'Реферальный код', 
        required: false, 
        example: 'REF777' 
    })
    @IsString()
    @IsOptional()
    refCode?: string;
}