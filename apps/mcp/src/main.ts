import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { EnvService } from "@open-dpp/env";
import { AppModule } from "./app.module";
import "reflect-metadata";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const configService = app.get(EnvService);
  const logger = new Logger("Bootstrap");

  app.enableCors({
    origin: "*",
  });
  const port = Number(configService.get("OPEN_DPP_MCP_PORT"));
  logger.log(`Application is running on: ${port}`);
  await app.listen(port, "0.0.0.0");
}

if (require.main === module) {
  bootstrap();
}
