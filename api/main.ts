import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Глобальная переменная для кэширования инстанса (предотвращает повторную инициализацию)
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );

    app.enableCors();
    
    // Инициализируем NestJS (подключение к БД, контроллеры и т.д.)
    await app.init();
    
    // Сохраняем именно expressApp, Vercel будет использовать его напрямую
    cachedApp = expressApp;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  // Просто передаем запрос и ответ в express-приложение NestJS
  return app(req, res);
}