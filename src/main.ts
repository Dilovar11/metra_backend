import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // Проверьте путь, обычно это ./app.module
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  // Создаем приложение напрямую без лишних оберток express()
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Настройка CORS
  app.enableCors();

  // Настройка статики для загрузок
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('METRA API')
    .setDescription('METRA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // CDN ссылки для Swagger UI
  const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css';
  const JS_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
  ];

  SwaggerModule.setup('api', app, document, {
    customCssUrl: CSS_URL,
    customJs: JS_URLS,
  });

  // Запуск сервера на порту 3000 (или из переменной окружения)
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  
  console.log(`🚀 Application is running on: http://localhost:${PORT}/api`);
}

bootstrap();