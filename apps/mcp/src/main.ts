import { NestFactory } from '@nestjs/core';
import { McpAppModule } from './mcp-app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(McpAppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: '*',
  });
  const port = Number(configService.get('PORT', '5000'));
  await app.listen(process.env.port ?? port);
}
bootstrap();
