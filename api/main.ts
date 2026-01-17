import express from 'express';
import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const expressApp = express();

let cachedHandler: any;

async function bootstrapServer() {
  if (!cachedHandler) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.enableCors();

    const config = new DocumentBuilder()
      .setTitle('NanoBanana API')
      .setDescription('API NanoBanana')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.init();

    cachedHandler = serverless(expressApp);
  }

  return cachedHandler;
}

export default async function handler(req, res) {
  const server = await bootstrapServer();
  return server(req, res);
}
