import express from 'express';
import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('NanoBanana API')
    .setDescription('API для генерации изображений через NanoBanana')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.init();

  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    await app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  }
}

bootstrap();

// ✅ Экспортируем handler всегда для Vercel
export const handler = serverless(expressApp);
