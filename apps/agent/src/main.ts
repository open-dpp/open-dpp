import { NestFactory } from '@nestjs/core';
import { AgentAppModule } from './agent-app.module';
import {
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from '@app/exception/exception.handler';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AgentAppModule);
  const configService = app.get(ConfigService);
  // Add microservice capabilities
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: Number(configService.get('MSG_PORT', '5002')), // Microservice port
    },
  });
  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
  );
  app.enableCors({
    origin: '*',
  });
  const port = Number(configService.get('PORT', '3003'));
  await app.startAllMicroservices();

  await app.listen(port, '0.0.0.0');
}
bootstrap();
