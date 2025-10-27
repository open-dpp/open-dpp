import type { NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { Injectable } from "@nestjs/common";
import * as express from "express";

@Injectable()
export class SkipBodyParsingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // skip body parsing for better-auth routes (supports with/without /api prefix)
    const url = (req.originalUrl || req.url || req.baseUrl || "") as string;
    if (url.startsWith("/api/auth") || url.startsWith("/auth")) {
      next();
      return;
    }

    // Parse the body as usual
    express.json()(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      express.urlencoded({ extended: true })(req, res, next);
    });
  }
}
