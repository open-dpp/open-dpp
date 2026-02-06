import { randomBytes } from "node:crypto";

export interface SessionCreateProps {
  userId: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  activeOrganizationId?: string | null;
  activeTeamId?: string | null;
  expiresAt?: Date;
}

export type SessionDbProps = SessionCreateProps & {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  activeOrganizationId: string | null;
  activeTeamId: string | null;
};

function generate24CharId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = randomBytes(8).toString("hex");
  return timestamp + random;
}

export class Session {
  public readonly id: string;
  public readonly userId: string;
  public readonly token: string;
  public readonly expiresAt: Date;
  public readonly ipAddress?: string | null;
  public readonly userAgent?: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly activeOrganizationId: string | null;
  public readonly activeTeamId: string | null;

  private constructor(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    createdAt: Date,
    updatedAt: Date,
    activeOrganizationId?: string | null,
    activeTeamId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.activeOrganizationId = activeOrganizationId ?? null;
    this.activeTeamId = activeTeamId ?? null;
  }

  public static create(data: SessionCreateProps) {
    const now = new Date();
    // Default to 7 days if not provided
    const defaultExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return new Session(
      generate24CharId(),
      data.userId,
      data.token,
      data.expiresAt ?? defaultExpiresAt,
      now,
      now,
      data.activeOrganizationId,
      data.activeTeamId,
      data.ipAddress,
      data.userAgent,
    );
  }

  public static loadFromDb(data: SessionDbProps) {
    return new Session(
      data.id,
      data.userId,
      data.token,
      data.expiresAt,
      data.createdAt,
      data.updatedAt,
      data.activeOrganizationId,
      data.activeTeamId,
      data.ipAddress,
      data.userAgent,
    );
  }
}
