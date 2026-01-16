import express from 'express';
import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

const isServerless = !!process.env.VERCEL;
const expressApp = express();

async function bootstrap() {
  let app;
  if (isServerless) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  } else {
    app = await NestFactory.create(AppModule);
  }

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('NanoBanana API')
    .setDescription('API для генерации изображений через NanoBanana')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  if (isServerless) {
    await app.init();
  } else {
    const port = process.env.PORT || 3000;
    await app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  }
}

bootstrap();

export const handler = isServerless ? serverless(expressApp) : undefined;
