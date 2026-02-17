// telegram.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { IS_PUBLIC_KEY } from 'src/Common/decorators/public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TelegramGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    // Получаем заголовок, который отправляет наш Angular интерцептор
    const initData = request.headers['x-telegram-init-data'];

    if (!initData) {
      throw new UnauthorizedException('Telegram data not found in headers');
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      throw new Error('BOT_TOKEN is not defined in environment');
    }

    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      // Сортируем параметры для проверки подписи
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Генерируем секретный ключ на основе токена бота
      const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Вычисляем проверочный хеш
      const checkHash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (checkHash !== hash) {
        throw new UnauthorizedException('Invalid Telegram signature');
      }

      // Если всё ок, парсим юзера и сохраняем его в объекте запроса
      const user = JSON.parse(urlParams.get('user') || '{}');
      request.tgUser = user;

      return true;
    } catch (e) {
      throw new UnauthorizedException('Error validating Telegram data');
    }
  }
}