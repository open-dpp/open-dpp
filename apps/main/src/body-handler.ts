import type { INestApplication } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import express from "express";

/**
 * Applies body size handling and JSON parsing middleware to the provided Nest application.
 * It selects a larger JSON body limit for specific integration routes, relaxes strict JSON
 * parsing for the AAS "$value" endpoints (which can receive a bare JSON scalar), and provides
 * robust error handling for payload too large and invalid JSON parsing errors.
 */
export function applyBodySizeHandler(app: INestApplication) {
  const configService = app.get(EnvService);

  // Single JSON body parser selector based on a precise integration route match
  const integrationRouteRegex = /^(?:\/api)?\/integration(?:\/|$)/;
  const betterAuthRouteRegex = /^(?:\/api)?\/auth(?:\/|$)/;
  const defaultJsonLimit = configService.get("OPEN_DPP_JSON_LIMIT_DEFAULT");
  const integrationJsonLimit = configService.get("OPEN_DPP_JSON_LIMIT_INTEGRATION");
  const defaultJsonParser = express.json({ limit: defaultJsonLimit });
  const integrationJsonParser = express.json({ limit: integrationJsonLimit });
  // strict: false — express.json() defaults to only accepting a top-level JSON object or
  // array. The $value endpoints (e.g. PATCH .../submodel-elements/:id/$value) can
  // legitimately receive a bare JSON scalar (a Property's value is just a string), which
  // strict mode would otherwise reject before it ever reaches route/DTO validation. Scoped
  // to just these routes (matched on the literal "/$value" path suffix) rather than relaxed
  // globally, so every other route keeps the stricter, safer default.
  const valueEndpointJsonParser = express.json({ limit: defaultJsonLimit, strict: false });
  const isValueEndpoint = (path: string) => path.endsWith("/$value");

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (betterAuthRouteRegex.test(req.path)) {
      return next();
    }
    if (isValueEndpoint(req.path)) {
      return valueEndpointJsonParser(req, res, next);
    }
    const parser = integrationRouteRegex.test(req.path) ? integrationJsonParser : defaultJsonParser;
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
    if (err?.type === "entity.parse.failed" || (err instanceof SyntaxError && "body" in err)) {
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
