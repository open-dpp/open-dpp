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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
  );
  applyBodySizeHandler(app);

  app.useGlobalPipes(new ValidationPipe());
  if (configService.get<string>('BUILD_OPEN_API_DOCUMENTATION') === 'true') {
    buildOpenApiDocumentation(app);
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
