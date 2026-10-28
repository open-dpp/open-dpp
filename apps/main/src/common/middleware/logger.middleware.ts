import type { NextFunction, Request, Response } from "express";
import { Logger } from "@nestjs/common";
import { CORRELATION_ID_HEADER } from "./correlation-id.middleware";

const DEV_SERVER_PATH_REGEX = /^\/(?:@[\w-]+|src|node_modules)\//;
const FILE_EXTENSION_REGEX = /\.\w+$/;
const BACKEND_PATH_REGEX = /^\/(?:api|gs1)(?:\/|$)/;

export function isFrontendAssetPath(path: string): boolean {
  if (BACKEND_PATH_REGEX.test(path)) {
    return false;
  }
  return (
    path.startsWith("/assets/") ||
    DEV_SERVER_PATH_REGEX.test(path) ||
    (FILE_EXTENSION_REGEX.test(path) && !path.endsWith(".html"))
  );
}

// Registered as plain express middleware in main.ts (not via Nest's MiddlewareConsumer),
// so it also logs requests outside the global "/api" prefix, e.g. the served frontend.
export function createLoggerMiddleware(logFormat: "json" | "plain") {
  const logger = new Logger("HTTP");

  return (req: Request, res: Response, next: NextFunction): void => {
    // Log the path only: query strings can carry secrets, e.g. /password-reset?token=…
    const { method, ip, path } = req;
    const userAgent = req.get("user-agent") || "";
    const correlationId = req.headers[CORRELATION_ID_HEADER];
    const startTime = Date.now();

    // Capture response finish event
    res.on("finish", () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      let message: string | object;
      if (logFormat === "json") {
        message = {
          correlationId,
          method,
          url: path,
          status: statusCode,
          ip,
          userAgent,
          duration,
        };
      } else {
        message = `${correlationId} ${method} ${path} ${statusCode} - ${ip} - ${userAgent} - ${duration}ms`;
      }

      if (statusCode >= 500) {
        logger.error(message);
      } else if (statusCode >= 400) {
        logger.warn(message);
      } else if (isFrontendAssetPath(path)) {
        logger.verbose(message);
      } else {
        logger.debug(message);
      }
    });

    next();
  };
}
