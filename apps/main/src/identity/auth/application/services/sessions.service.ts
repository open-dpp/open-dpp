import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { AUTH } from "../../auth.provider";
import { SessionMapper } from "../../infrastructure/mappers/session.mapper";

@Injectable()
export class SessionsService {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async getSession(headers: Headers) {
    const betterAuthSession = await this.auth.api.getSession({
      headers,
    });
    if (!betterAuthSession) {
      return null;
    }
    return SessionMapper.toDomainFromBetterAuth(betterAuthSession.session);
  }
}
