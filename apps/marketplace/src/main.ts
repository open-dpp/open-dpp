import { NestFactory } from '@nestjs/core';
import { MarketplaceAppModule } from './marketplace-app.module';

async function bootstrap() {
  const app = await NestFactory.create(MarketplaceAppModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
