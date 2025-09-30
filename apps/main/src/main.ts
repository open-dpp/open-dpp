import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from '@app/exception/exception.handler';
import { buildOpenApiDocumentation } from './open-api-docs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ValidationPipe } from '@nestjs/common';
import { applyBodySizeHandler } from './BodySizeHandler';
import * as bodyParser from 'body-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EnvService } from 'libs/env/src/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(EnvService);

  // Proxy SPA routes in development before setting global prefix
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      '/',
      createProxyMiddleware({
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
        // Only proxy requests NOT starting with /api
        pathFilter: (pathname) => !pathname.startsWith('/api'),
      }),
    );
  }

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
  );
  applyBodySizeHandler(app);
  app.use(
    '/media/upload-dpp-file/:upi',
    bodyParser.urlencoded({ limit: '50mb', extended: true }),
  );

  app.useGlobalPipes(new ValidationPipe());
  if (configService.get('OPEN_DPP_BUILD_API_DOC')) {
    buildOpenApiDocumentation(app);
  }
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: Number(configService.get('OPEN_DPP_MSG_PORT')), // Microservice port
    },
  });
  await app.startAllMicroservices();
  const port = Number(configService.get('OPEN_DPP_PORT'));
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
