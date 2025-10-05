import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import "reflect-metadata";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  app.enableCors({
    origin: "*",
  });
  const port = Number(configService.get("PORT_MCP", "5000"));
  logger.log(`Application is running on: ${port}`);
  await app.listen(port, "0.0.0.0");
}

if (require.main === module) {
  bootstrap();
}
