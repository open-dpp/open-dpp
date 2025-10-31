import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { getSession } from "better-auth/api";
import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "./auth.service";

/**
 * Type representing a valid user session after authentication
 * Excludes null and undefined values from the session return type
 */
export type BaseUserSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getSession>>>
>;

export type UserSession = BaseUserSession & {
  user: BaseUserSession["user"] & {
    role?: string | string[];
  };
};

/**
 * NestJS guard that handles authentication for protected routes
 * Can be configured with @AllowAnonymous() or @OptionalAuth() decorators to modify authentication behavior
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly reflector: Reflector;
  private readonly authService: AuthService;

  constructor(
    @Inject(Reflector)
    reflector: Reflector,
    authService: AuthService,
  ) {
    this.reflector = reflector;
    this.authService = authService;
  }

  /**
   * Validates if the current request is authenticated
   * Attaches session and user information to the request object
   * Supports both HTTP and GraphQL execution contexts
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session: UserSession | null = await this.authService.getSession(fromNodeHeaders(
      request.headers || request?.handshake?.headers || [],
    ),
    );

    request.session = session;
    request.user = session?.user ?? null; // useful for observability tools like Sentry

    const isPublic = this.reflector.getAllAndOverride<boolean>("PUBLIC", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic)
      return true;

    const isOptional = this.reflector.getAllAndOverride<boolean>("OPTIONAL", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isOptional && !session)
      return true;

    if (!session) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>("ROLES", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = session.user.role;
      let hasRole = false;
      if (Array.isArray(userRole)) {
        hasRole = userRole.some(role => requiredRoles.includes(role));
      }
      else if (typeof userRole === "string") {
        hasRole = requiredRoles.includes(userRole);
      }

      if (!hasRole) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
    }

    return true;
  }
}
