import type { NextFunction, Request, Response } from "express";
import { writeFileSync } from "node:fs";
import process, { exit } from "node:process";
import { ConsoleLogger, Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import * as bodyParser from "body-parser";
import { createProxyServer } from "http-proxy-3";
import { McpClientService } from "./ai/mcp-client/mcp-client.service";
import { AppModule } from "./app.module";
import { applyBodySizeHandler } from "./body-handler";
import { addSwaggerToApp, buildOpenApiDocumentation } from "./open-api-docs";

const EXPORT_API_DOC_FLAG = "--export-api-doc";
const DEFAULT_API_DOC_OUTPUT_PATH = "docs/api-docs.json";

async function bootstrap() {
  if (process.argv[2] && process.argv[2] === EXPORT_API_DOC_FLAG) {
    const outputPath = process.argv[3] ?? DEFAULT_API_DOC_OUTPUT_PATH;

    const apiDoc = buildOpenApiDocumentation();
    try {
      writeFileSync(outputPath, JSON.stringify(apiDoc), "utf-8");
    }
    catch (error) {
      console.error(error);
      exit(1);
    }
    exit(0);
  }

  // Determine log format from environment variable
  const logFormat = process.env.OPEN_DPP_LOG_FORMAT || "plain";
  const useJsonLogging = logFormat === "json";

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: new ConsoleLogger({
      json: useJsonLogging,
      logLevels: ["log", "error", "warn", "debug", "verbose"],
    }),
  });

  const envService = app.get(EnvService);
  const logger = new Logger("Bootstrap");

  // Proxy SPA routes in development before setting global prefix
  if (process.env.NODE_ENV !== "production") {
    logger.log("Proxy established for routes / except /api");

    const proxy = createProxyServer({
      target: "http://localhost:5173",
      changeOrigin: true,
      ws: true,
    });
    const httpServer = app.getHttpServer() as import("node:http").Server;

    proxy.on("error", (err, _req, _res) => {
      logger.error(`Proxy error: ${err.message}`);
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.path.startsWith("/api")) {
        proxy.web(req, res, { target: "http://localhost:5173" });
      }
      else {
        next();
      }
    });

    httpServer.on("upgrade", (req, socket, head) => {
      if (req.url && !req.url.startsWith("/api")) {
        proxy.ws(req, socket, head, { target: "http://localhost:5173" });
      }
    });
  }

  app.setGlobalPrefix("api");
  app.enableCors({
    credentials: true,
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  });
  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
    new ForbiddenExceptionFilter(),
  );
  applyBodySizeHandler(app);
  app.use(
    "/media/upload-dpp-file/:upi",
    bodyParser.urlencoded({ limit: "50mb", extended: true }),
  );

  app.useGlobalPipes(new ValidationPipe());
  if (envService.get("OPEN_DPP_BUILD_API_DOC")) {
    const doc = buildOpenApiDocumentation();
    addSwaggerToApp(app, doc);
  }
  const port = envService.get("OPEN_DPP_PORT");
  logger.log(`Application is running on: ${port}`);
  await app.listen(port);
  try {
    const mcpClientService = app.get(McpClientService);
    await mcpClientService.connect();
  }
  catch (err) {
    logger.error(`MCP connect failed: ${err instanceof Error ? err.message : String(err)}`);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
