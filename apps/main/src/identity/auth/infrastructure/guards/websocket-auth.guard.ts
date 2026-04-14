import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { Session } from "better-auth";
import { Socket } from "socket.io";
import { MembersRepository } from "../../../organizations/infrastructure/adapters/members.repository";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { SessionsService } from "../../application/services/sessions.service";

/**
 * NestJS guard that handles authentication for protected routes
 * Can be configured with @AllowAnonymous() or @OptionalAuth() decorators to modify authentication behavior
 */
@Injectable()
export class WebsocketAuthGuard implements CanActivate {
  constructor(
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
    const client = context.switchToWs().getClient<Socket>();
    let session: Session | null = null;

    const headers = new Headers();
    if (client.handshake.headers.cookie) {
      headers.set("cookie", client.handshake.headers.cookie);
    }

    try {
      session = await this.sessionsService.getSession(headers);
    } catch {
      // If session retrieval fails, treat as no session
    }

    if (session) {
      client.data.user = (await this.usersRepository.findOneById(session.userId)) ?? null;
      const organizationId = client.handshake.auth.organizationId ?? null;
      if (organizationId) {
        client.data.member = await this.membersRepository.findOneByUserIdAndOrganizationId(
          session.userId,
          organizationId,
        );
      }
    }

    return true;
  }
}
