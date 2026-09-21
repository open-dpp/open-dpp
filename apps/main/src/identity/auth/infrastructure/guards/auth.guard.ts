import type { CanActivate, ExecutionContext } from "@nestjs/common";
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { randomUUID } from "node:crypto";
import { MembersRepository } from "../../../organizations/infrastructure/adapters/members.repository";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { SessionsService } from "../../application/services/sessions.service";
import { AUTH_BASE_PATH } from "../../auth-base-path";
import { AuthMethod, Session } from "../../domain/session";
import { MEMBER_HAS_ROLE } from "../../presentation/decorators/member-has-role.decorator";
import { ORGANIZATION_ID_HEADER } from "../../presentation/decorators/organization-id.decorator";
import { SESSION_ONLY } from "../../presentation/decorators/session-only.decorator";
import { USER_HAS_ROLE } from "../../presentation/decorators/user-has-role.decorator";

/** Placeholder tokens of the per-request sessions the guard synthesizes for non-cookie credentials. */
const API_KEY_SESSION_TOKEN = "api-key";
const OAUTH_SESSION_TOKEN = "oauth";

const BEARER_SCHEME = /^Bearer\s+(\S+)$/i;

/** Transports reachable without a session although they carry no decorator (SSE, MCP messages). */
const ANONYMOUS_PATHS = [
  `/api/${LatestApiVersionWithPrefixDto}/sse`,
  `/api/${LatestApiVersionWithPrefixDto}/messages`,
];

/** The token of an RFC 6750 bearer header, or undefined for any other authorization header. */
function bearerToken(authorization: unknown): string | undefined {
  if (typeof authorization !== "string") {
    return undefined;
  }
  return BEARER_SCHEME.exec(authorization)?.[1];
}

function invalidAccessToken(): UnauthorizedException {
  return new UnauthorizedException({
    code: "UNAUTHORIZED",
    message: "Invalid or expired access token",
  });
}

function forbidden(message: string): ForbiddenException {
  return new ForbiddenException({ code: "FORBIDDEN", message });
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/**
 * NestJS guard that handles authentication for protected routes. Three credentials
 * are accepted: the browser session cookie, an api key (`x-api-key`) and, while the
 * OAuth Provider is enabled, a Trusted Client access token (`Authorization: Bearer`).
 * Can be configured with @AllowAnonymous() or @OptionalAuth() decorators to modify
 * authentication behavior, and with @SessionOnly() to accept the cookie alone.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    private readonly configService: EnvService,
    private readonly sessionsService: SessionsService,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  /**
   * Validates if the current request is authenticated
   * Attaches session and user information to the request object
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.correlationId = request.headers["x-correlation-id"] ?? randomUUID();
    const url = request.url as string;

    const accessToken = this.presentedAccessToken(request);
    const session = await this.attachSession(request, accessToken);

    if (this.metadata<boolean>(context, "PUBLIC")) {
      return true;
    }
    if (this.metadata<boolean>(context, "OPTIONAL") && !session) {
      return true;
    }
    if (!session) {
      // a presented access token that did not hold is refused where a session is required
      if (accessToken !== undefined) {
        throw invalidAccessToken();
      }
      return ANONYMOUS_PATHS.includes(url.split("?")[0]);
    }
    if (
      this.metadata<boolean>(context, SESSION_ONLY) &&
      session.authMethod !== AuthMethod.SESSION
    ) {
      throw forbidden("This endpoint requires a browser session");
    }
    if (!url.startsWith(AUTH_BASE_PATH) && !(await this.attachMember(request, session))) {
      return false;
    }
    this.assertRoles(context, request);
    return true;
  }

  private metadata<T>(context: ExecutionContext, key: string): T | undefined {
    return this.reflector.getAllAndOverride<T>(key, [context.getHandler(), context.getClass()]);
  }

  private apiKeyOf(request: any): string | undefined {
    return request.headers["x-api-key"] || request.headers["X-API-KEY"] || undefined;
  }

  /**
   * The bearer token a request presents as its credential: only while the OAuth
   * Provider is enabled (otherwise the header rides along to the session lookup, as
   * it always has) and never next to an api key, which wins.
   */
  private presentedAccessToken(request: any): string | undefined {
    if (this.apiKeyOf(request) || !this.sessionsService.acceptsAccessTokens) {
      return undefined;
    }
    return bearerToken(request.headers.authorization);
  }

  /** Authenticates the request and decorates it with `session` and `user`. */
  private async attachSession(
    request: any,
    accessToken: string | undefined,
  ): Promise<Session | null> {
    const authenticated = await this.authenticate(request, accessToken);
    const user = authenticated
      ? ((await this.usersRepository.findOneById(authenticated.userId)) ?? null)
      : null;
    // an access token outlives its User by up to its lifetime; nobody is left to act for
    const session = authenticated?.authMethod === AuthMethod.OAUTH && !user ? null : authenticated;
    request.session = session;
    request.user = session ? user : null;
    return session;
  }

  private async authenticate(
    request: any,
    accessToken: string | undefined,
  ): Promise<Session | null> {
    const apiKey = this.apiKeyOf(request);
    if (apiKey) {
      return this.sessionFromApiKey(apiKey);
    }
    if (accessToken !== undefined) {
      return this.sessionFromAccessToken(accessToken);
    }
    return this.sessionFromBrowser(request.headers);
  }

  private async sessionFromApiKey(apiKey: string): Promise<Session | null> {
    try {
      const verifiedKey = await this.sessionsService.verifyApiKey(apiKey);
      if (!verifiedKey) {
        return null;
      }
      return Session.create({
        userId: verifiedKey.userId,
        token: API_KEY_SESSION_TOKEN,
        authMethod: AuthMethod.API_KEY,
      });
    } catch (error) {
      // a failed verification is no session; the reason stays in the log
      this.logger.debug(`Api key verification failed: ${describeError(error)}`);
      return null;
    }
  }

  private async sessionFromAccessToken(accessToken: string): Promise<Session | null> {
    const verified = await this.sessionsService.verifyAccessToken(accessToken);
    if (!verified) {
      return null;
    }
    return Session.create({
      userId: verified.userId,
      token: OAUTH_SESSION_TOKEN,
      authMethod: AuthMethod.OAUTH,
      expiresAt: verified.expiresAt,
    });
  }

  private async sessionFromBrowser(
    requestHeaders: Record<string, string | undefined>,
  ): Promise<Session | null> {
    const headers = new Headers();
    if (requestHeaders.cookie) {
      headers.set("cookie", requestHeaders.cookie);
    }
    if (requestHeaders.authorization) {
      headers.set("authorization", requestHeaders.authorization);
    }
    try {
      return await this.sessionsService.getSession(headers);
    } catch (error) {
      // a failed lookup is no session; the reason stays in the log
      this.logger.debug(`Session lookup failed: ${describeError(error)}`);
      return null;
    }
  }

  /** Resolves the organization context from the header; false when the User is no member. */
  private async attachMember(request: any, session: Session): Promise<boolean> {
    const organizationId = request.headers[ORGANIZATION_ID_HEADER] ?? null;
    if (!organizationId) {
      return true;
    }
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(
      session.userId,
      organizationId,
    );
    if (member === null) {
      return false;
    }
    request.member = member;
    return true;
  }

  private assertRoles(context: ExecutionContext, request: any): void {
    const requiredRoles = this.metadata<string[]>(context, USER_HAS_ROLE);
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = request.user?.role;
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw forbidden("Insufficient permissions");
      }
    }
    const requiredMemberRoles = this.metadata<string[]>(context, MEMBER_HAS_ROLE);
    if (requiredMemberRoles && requiredMemberRoles.length > 0) {
      const memberRole = request.member?.role;
      if (!memberRole || !requiredMemberRoles.includes(memberRole)) {
        throw forbidden("Insufficient permissions");
      }
    }
  }
}
