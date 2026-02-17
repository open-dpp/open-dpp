import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";

/**
 * Parameter decorator that extracts the authenticated user's email from the request.
 * The email is resolved from BetterAuth's session response during authentication
 * and stored on the request by the AuthGuard.
 * Works only with HTTP execution contexts.
 */
export const AuthUserEmail: ReturnType<typeof createParamDecorator>
  = createParamDecorator((_data: unknown, context: ExecutionContext): unknown => {
    const request = context.switchToHttp().getRequest();
    return request.userEmail as string;
  });
