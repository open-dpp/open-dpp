import { Session as BetterAuthSessionSchema } from "better-auth";
import { Session, SessionDbProps } from "../../domain/session";
import { SessionDocument, SessionSchemaType } from "../schemas/session.schema";

export class SessionMapper {
  static toDomain(document: SessionDocument): Session {
    const props: SessionDbProps = {
      id: document.id,
      userId: document.userId,
      token: document.token,
      createdAt: document.createdAt,
      expiresAt: document.expiresAt,
      updatedAt: document.updatedAt,
      ipAddress: document.ipAddress,
      userAgent: document.userAgent,
      activeOrganizationId: document.activeOrganizationId,
      activeTeamId: document.activeTeamId,
    };
    return Session.loadFromDb(props);
  }

  static toPersistence(entity: Session): SessionSchemaType {
    return {
      _id: entity.id,
      userId: entity.userId,
      token: entity.token,
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
      updatedAt: entity.updatedAt,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      activeOrganizationId: entity.activeOrganizationId,
      activeTeamId: entity.activeTeamId,
    };
  }

  static toDomainFromBetterAuth(betterAuthSession: BetterAuthSessionSchema): Session {
    const props: SessionDbProps = {
      id: betterAuthSession.id,
      userId: betterAuthSession.userId,
      token: betterAuthSession.token,
      createdAt: betterAuthSession.createdAt,
      expiresAt: betterAuthSession.expiresAt,
      updatedAt: betterAuthSession.updatedAt,
      ipAddress: betterAuthSession.ipAddress,
      userAgent: betterAuthSession.userAgent,
      activeOrganizationId: (betterAuthSession as any).activeOrganizationId,
      activeTeamId: (betterAuthSession as any).activeTeamId,
    };
    return Session.loadFromDb(props);
  }
}
