import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { z } from "zod";

export const UserEmailDecorator: ReturnType<typeof createParamDecorator> = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    return z.email().parse(request.user?.email);
  },
);
