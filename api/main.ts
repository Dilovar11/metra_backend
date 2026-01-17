import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

    // Настройка Swagger
    const config = new DocumentBuilder()
      .setTitle('METRA API')
      .setDescription('METRA')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // ВАЖНО: Добавьте customSiteTitle или другие опции, 
    // чтобы форсировать правильную инициализацию
    SwaggerModule.setup('api', app, document, {
      useGlobalPrefix: false, // если у вас нет глобального префикса
    });

    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  // Просто передаем запрос и ответ в express-приложение NestJS
  return app(req, res);
}