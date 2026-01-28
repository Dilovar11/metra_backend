import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    telegramId: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string; 

    @IsString()
    @IsOptional()
    refCode?: string;
}