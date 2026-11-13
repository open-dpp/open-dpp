import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const MAX_CORRELATION_ID_LENGTH = 128;

// Caller-supplied ids land in every log line and are echoed back, so only plain tokens such as
// UUIDs or W3C trace ids are reused; anything else is replaced instead of failing the request.
const CorrelationIdSchema = z
  .string()
  .max(MAX_CORRELATION_ID_LENGTH)
  .regex(/^[\w.:-]+$/);

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const supplied = CorrelationIdSchema.safeParse(req.headers[CORRELATION_ID_HEADER]);
  const correlationId = supplied.success ? supplied.data : uuidv4();
  req.headers[CORRELATION_ID_HEADER] = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
