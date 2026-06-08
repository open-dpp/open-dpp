import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { z } from "zod";
import { CORRELATION_ID_HEADER } from "../middleware/correlation-id.middleware";
import { randomUUID } from "node:crypto";

export const CorrelationIdDecorator: ReturnType<typeof createParamDecorator> = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    return z.string().parse(request.headers[CORRELATION_ID_HEADER] ?? randomUUID());
  },
);
