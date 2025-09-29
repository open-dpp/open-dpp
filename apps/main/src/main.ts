import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from '@app/exception/exception.handler';
import { buildOpenApiDocumentation } from './open-api-docs';
import { ValidationPipe } from '@nestjs/common';
import { applyBodySizeHandler } from './BodySizeHandler';
import * as bodyParser from 'body-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Proxy SPA routes in development before setting global prefix
  /* if (process.env.NODE_ENV !== 'production') {
    app.use(
      '/',
      createProxyMiddleware({
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
        // Only proxy requests NOT starting with /api
        pathFilter: (pathname, _req) => !pathname.startsWith('/api'),
      }),
    );
  } */

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
  if (configService.get<string>('BUILD_OPEN_API_DOCUMENTATION') === 'true') {
    buildOpenApiDocumentation(app);
  }
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: Number(configService.get('MSG_PORT', '5002')), // Microservice port
    },
  });
  await app.startAllMicroservices();
  const port = Number(configService.get('PORT', '3000'));
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
