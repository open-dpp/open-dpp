import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { Session as SessionDomainEntity } from "../../domain/session";

/**
 * Parameter decorator that extracts the user session from the request.
 * Provides easy access to the authenticated user's session data in controller methods.
 * Works only with HTTP execution contexts.
 */
export const AuthSession: ReturnType<typeof createParamDecorator>
  = createParamDecorator((_data: unknown, context: ExecutionContext): unknown => {
    const request = context.switchToHttp().getRequest();
    return request.session as SessionDomainEntity;
  });
