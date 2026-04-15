import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { AUTH } from "../../auth.provider";
import { SessionMapper } from "../../infrastructure/mappers/session.mapper";

export interface VerifiedApiKey {
  userId: string;
}

@Injectable()
export class SessionsService {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  async getSession(headers: Headers) {
    const betterAuthSession = await this.auth.api.getSession({
      headers,
    });
    if (!betterAuthSession) {
      return null;
    }
    return SessionMapper.toDomainFromBetterAuth(betterAuthSession.session);
  }

  async verifyApiKey(key: string): Promise<VerifiedApiKey | null> {
    const result = await (this.auth.api as any).verifyApiKey({
      body: { key },
    });
    if (!result?.valid || !result?.key) {
      return null;
    }
    return { userId: result.key.userId };
  }
}
