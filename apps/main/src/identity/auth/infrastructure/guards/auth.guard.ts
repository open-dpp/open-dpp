import type { CanActivate, ExecutionContext } from "@nestjs/common";
import {
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EnvService } from "@open-dpp/env";
import { MembersRepository } from "../../../organizations/infrastructure/adapters/members.repository";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { SessionsService } from "../../application/services/sessions.service";
import { Session } from "../../domain/session";
import { USER_HAS_ROLE } from "../../presentation/decorators/user-has-role.decorator";

/**
 * NestJS guard that handles authentication for protected routes
 * Can be configured with @AllowAnonymous() or @OptionalAuth() decorators to modify authentication behavior
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    private readonly configService: EnvService,
    private readonly sessionsService: SessionsService,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {

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

    let session: Session | null = null;

    if (apiKeyHeader) {
      try {
        const verifiedKey = await this.sessionsService.verifyApiKey(apiKeyHeader);
        if (verifiedKey) {
          session = Session.create({
            userId: verifiedKey.userId,
            token: "api-key",
          });
        }
      }
      catch {
        // If API key verification fails, treat as no session
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
        session = await this.sessionsService.getSession(headers);
      }
      catch {
        // If session retrieval fails, treat as no session
      }
    }

    request.session = session;
    request.user = null;
    if (session) {
      request.user = (await this.usersRepository.findOneById(session.userId)) ?? null;
    }

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
      return allowedPaths.includes(path);
    }

    const isBetterAuthUrl = url.startsWith("/api/auth");
    if (!isBetterAuthUrl) {
      const organizationId = request.headers["x-open-dpp-organization-id"] ?? null;
      if (organizationId) {
        const member = await this.membersRepository.findOneByUserIdAndOrganizationId(session.userId, organizationId);
        if (member === null) {
          return false;
        }
        request.member = member;
      }
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(USER_HAS_ROLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = request.user?.role;
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }
    }

    return true;
  }
}
