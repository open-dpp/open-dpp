import { NestFactory } from '@nestjs/core';
import { MediaAppModule } from './media-app.module';
import {
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from '@app/exception/exception.handler';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(MediaAppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
  );
  app.enableCors({
    origin: '*',
  });
  app.use(
    '/media/upload-dpp-file/:upi',
    bodyParser.urlencoded({ limit: '50mb', extended: true }),
  );
  const port = Number(configService.get('PORT', '3004'));
  await app.listen(process.env.port ?? port);
}
bootstrap();
