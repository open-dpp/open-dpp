import type { NextFunction, Request, Response } from "express";
import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");
  private readonly logFormat: "json" | "plain";

  constructor(private readonly envService: EnvService) {
    this.logFormat = this.envService.get("OPEN_DPP_LOG_FORMAT") as
    | "json"
    | "plain";
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "";
    const startTime = Date.now();

    // Capture response finish event
    res.on("finish", () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      let message: string | object;
      if (this.logFormat === "json") {
        message = {
          method,
          url: originalUrl,
          status: statusCode,
          ip,
          userAgent,
          duration,
        };
      }
      else {
        message = `${method} ${originalUrl} ${statusCode} - ${ip} - ${userAgent} - ${duration}ms`;
      }

      if (statusCode >= 500) {
        this.logger.error(message);
      }
      else if (statusCode >= 400) {
        this.logger.warn(message);
      }
      else {
        this.logger.debug(message);
      }
    });

    next();
  }
}
