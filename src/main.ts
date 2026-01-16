import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import serverless from 'serverless-http';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

dotenv.config();

// Проверяем, работаем ли мы на сервере (Vercel) или локально
const isServerless = !!process.env.VERCEL;

const expressApp = express();

async function bootstrap() {
  let app;

  if (isServerless) {
    // Для Vercel / serverless
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
  } else {
    // Локальный режим
    app = await NestFactory.create(AppModule);
  }

  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('NanoBanana API')
    .setDescription('API для генерации изображений через NanoBanana')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  if (isServerless) {
    // Для serverless: инициализация без прослушивания порта
    await app.init();
  } else {
    // Локально: слушаем порт
    const port = process.env.PORT || 3000;
    await app.listen(port, () =>
      console.log(`Server running on http://localhost:${port}`),
    );
  }
}

bootstrap();

// Экспорт handler только для serverless
export const handler = isServerless ? serverless(expressApp) : undefined;
