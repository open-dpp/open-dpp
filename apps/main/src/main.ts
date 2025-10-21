import type { MicroserviceOptions } from "@nestjs/microservices";
import process from "node:process";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import {
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import * as bodyParser from "body-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import { AppModule } from "./app.module";
import { applyBodySizeHandler } from "./BodySizeHandler";
import { buildOpenApiDocumentation } from "./open-api-docs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  // Proxy SPA routes in development before setting global prefix
  if (process.env.NODE_ENV !== "production") {
    logger.log("Proxy established for routes / except /api");
    app.use(
      "/",
      createProxyMiddleware({
        target: "http://localhost:5173",
        changeOrigin: true,
        ws: true,
        // Only proxy requests NOT starting with /api
        pathFilter: pathname => !pathname.startsWith("/api"),
      }),
    );
  }

  app.setGlobalPrefix("api");
  app.enableCors({
    credentials: true,
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  });
  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
  );
  applyBodySizeHandler(app);
  app.use(
    "/media/upload-dpp-file/:upi",
    bodyParser.urlencoded({ limit: "50mb", extended: true }),
  );

  app.useGlobalPipes(new ValidationPipe());
  if (configService.get("OPEN_DPP_BUILD_API_DOC")) {
    buildOpenApiDocumentation(app);
  }
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: Number(configService.get("OPEN_DPP_MSG_PORT")), // Microservice port
    },
  });
  await app.startAllMicroservices();
  const port = Number(configService.get("OPEN_DPP_PORT"));
  logger.log(`Application is running on: ${port}`);
  await app.listen(port);
}
bootstrap();
