import { Injectable, NestMiddleware } from "@nestjs/common";
// The middleware is base on Express out of the box, don't
// be alerted with a 'express' import, it's part of Nest
import { NextFunction, Request, Response } from "express";
// Here is the only dependency that we'll use
import { v4 as uuidv4 } from "uuid";
import { CorrelationIdService } from "./correlation-id.service";
export const CORRELATION_ID_HEADER = "x-correlation-id";
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    // You'll need here the service created Earlier
    private correlationIdService: CorrelationIdService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // We check if we already have a correlation ID set for this request
    const currentCorrelationId = this.correlationIdService.getCorrelationId();

    // If we don't have the correlation ID already set
    if (!currentCorrelationId) {
      // it means we need to create a new one.
      // two options :
      // - Either the caller already provide a correlation ID and we use this one
      // - Either you generate a new correlation ID

      const providedCorrelationId = req.headers[CORRELATION_ID_HEADER] as string;
      this.correlationIdService.setCorrelationId(providedCorrelationId ?? uuidv4());
    }

    // Setting the correlation ID in both request and response if not present
    req.headers[CORRELATION_ID_HEADER] = this.correlationIdService.getCorrelationId();
    res.setHeader(CORRELATION_ID_HEADER, this.correlationIdService.getCorrelationId());

    // Continuing the request lifecycle
    next();
  }
}
