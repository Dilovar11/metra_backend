import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../Common/decorators/public.decorator';

@Public()
@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация с учетом реферального кода' })
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }
}