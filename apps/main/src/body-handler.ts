import type { INestApplication } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import express from "express";

/**
 * Applies body size handling and JSON parsing middleware to the provided Nest application.
 * It selects a larger JSON body limit for specific integration routes and provides
 * robust error handling for payload too large and invalid JSON parsing errors.
 */
export function applyBodySizeHandler(app: INestApplication) {
  const configService = app.get(EnvService);

  // Single JSON body parser selector based on a precise integration route match
  const integrationRouteRegex = /^\/organizations\/[^/]+\/integration(?:\/|$)/;
  const betterAuthRouteRegex = /^(?:\/api)?\/auth(?:\/|$)/;
  const defaultJsonLimit = configService.get("OPEN_DPP_JSON_LIMIT_DEFAULT");
  const integrationJsonLimit = configService.get(
    "OPEN_DPP_JSON_LIMIT_INTEGRATION",
  );
  const defaultJsonParser = express.json({ limit: defaultJsonLimit });
  const integrationJsonParser = express.json({ limit: integrationJsonLimit });

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (betterAuthRouteRegex.test(req.path)) {
      return next();
    }
    const parser = integrationRouteRegex.test(req.path)
      ? integrationJsonParser
      : defaultJsonParser;
    return parser(req, res, next);
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({
        statusCode: 413,
        message: "Payload Too Large",
        error: "PayloadTooLargeError",
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    }
    if (
      err?.type === "entity.parse.failed"
      || (err instanceof SyntaxError && "body" in err)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid JSON payload",
        error: "BadRequest",
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    }
    return next(err);
  });
}
