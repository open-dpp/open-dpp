export class Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Session>) {
    Object.assign(this, partial);
  }
}
