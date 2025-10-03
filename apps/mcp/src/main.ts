import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import "reflect-metadata";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: "*",
  });
  const port = Number(configService.get("PORT", "5000"));
  await app.listen(port, "0.0.0.0");
}

if (require.main === module) {
  bootstrap();
}
