import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );

    app.enableCors();
    // Swagger лучше отключить здесь для теста, чтобы исключить его влияние
    await app.init();

    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export default async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};