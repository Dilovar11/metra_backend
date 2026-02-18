import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();

    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp)
    );

    app.enableCors({
      origin: '*', 
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });

    // Настройка Swagger
    const config = new DocumentBuilder()
      .setTitle('METRA API')
      .setDescription('METRA')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Ссылки на официальные файлы Swagger UI в CDN
    const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css';
    const JS_URLS = [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ];

    SwaggerModule.setup('api', app, document, {
      customCssUrl: CSS_URL,
      customJs: JS_URLS,
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