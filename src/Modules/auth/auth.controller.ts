import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация с учетом реферального кода' })
  async register(@Body() dto: RegisterDto) {
    // Внутри authService.register должна быть логика поиска кода 
    // и создания записи в таблице Referral
    return await this.authService.register(dto);
  }
}