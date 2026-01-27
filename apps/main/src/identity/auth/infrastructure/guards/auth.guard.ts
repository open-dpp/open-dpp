import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { getSession } from "better-auth/api";
import {
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EnvService } from "@open-dpp/env";
import { AuthService } from "../../application/services/auth.service";
import { ALLOW_SERVICE_ACCESS } from "../../presentation/decorators/allow-service-access.decorator";

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
  private readonly configService: EnvService;

  constructor(
    @Inject(Reflector)
    reflector: Reflector,
    authService: AuthService,
    configService: EnvService,
  ) {
    this.reflector = reflector;
    this.authService = authService;
    this.configService = configService;
  }

  /**
   * Validates if the current request is authenticated
   * Attaches session and user information to the request object
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url as string;

    const apiKeyHeader = request.headers["x-api-key"] || request.headers["X-API-KEY"];
    const serviceTokenHeader = request.headers.service_token;

    let session: UserSession | null = null;

    const isAllowServiceAccess = this.reflector.getAllAndOverride<boolean>(ALLOW_SERVICE_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAllowServiceAccess && serviceTokenHeader) {
      return serviceTokenHeader === this.configService.get("OPEN_DPP_SERVICE_TOKEN");
    }

    if (apiKeyHeader) {
      const headers = new Headers();
      headers.set("x-api-key", apiKeyHeader);
      try {
        session = await this.authService.getSession(headers);
      }
      catch {
        // If session retrieval fails, treat as no session
      }
    }
    else {
      const headers = new Headers();
      if (request.headers.cookie) {
        headers.set("cookie", request.headers.cookie);
      }
      if (request.headers.authorization) {
        headers.set("authorization", request.headers.authorization);
      }
      try {
        session = await this.authService.getSession(headers);
      }
      catch {
        // If session retrieval fails, treat as no session
      }
    }

    request.session = session;
    request.user = session?.user ?? null;

    const isPublic = this.reflector.getAllAndOverride<boolean>("PUBLIC", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isOptional = this.reflector.getAllAndOverride<boolean>("OPTIONAL", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isOptional && !session) {
      return true;
    }

    if (!session) {
      const allowedPaths = ["/api/sse", "/api/messages"];
      const path = url.split("?")[0];
      if (allowedPaths.includes(path)) {
        return true;
      }
      return false;
    }

    const isBetterAuthUrl = url.startsWith("/api/auth");
    if (!isBetterAuthUrl) {
      const organizationId = request.params.organizationId ?? request.params.orgaId ?? null;
      if (organizationId) {
        const isMember = await this.authService.isMemberOfOrganization(session.user.id, organizationId);
        if (!isMember) {
          return false;
        }
      }
    }

    /* const requiredRoles = this.reflector.getAllAndOverride<string[]>("ROLES", [
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
    } */

    return true;
  }
}
