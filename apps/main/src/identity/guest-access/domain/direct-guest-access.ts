import { randomUUID } from "node:crypto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod";
import { User } from "../../users/domain/user";
import { CallerFacts, GuestAccess } from "./guest-access";
import {
  GuestAccessKind,
  GuestAccessKindType,
  GuestAccessStatus,
  GuestAccessStatusType,
} from "./guest-access-kind.enum";
import { GuestRoleEnum, GuestRoleType } from "./guest-role.enum";

export const DirectGuestAccessPlainSchema = z.object({
  kind: z.literal(GuestAccessKind.DIRECT),
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  guestRole: GuestRoleEnum,
  grantedBy: z.string(),
  createdAt: z.coerce.date(),
  acceptedByUserId: z.string().optional(),
  acceptedAt: z.coerce.date().optional(),
  revokedAt: z.coerce.date().optional(),
});

export type DirectGuestAccessPlain = z.infer<typeof DirectGuestAccessPlainSchema>;

export interface DirectGuestAccessCreateProps {
  organizationId: string;
  email: string;
  guestRole: GuestRoleType;
  grantedBy: string;
  now?: Date;
}

/**
 * Access given to one individual who is invited by email. It grants nothing until the invited
 * person accepts it with an account whose verified email matches. From then on it is bound to
 * that account's user id.
 */
export class DirectGuestAccess implements GuestAccess {
  readonly kind: GuestAccessKindType = GuestAccessKind.DIRECT;

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly email: string,
    private _guestRole: GuestRoleType,
    public readonly grantedBy: string,
    public readonly createdAt: Date,
    private _acceptedByUserId: string | undefined,
    private _acceptedAt: Date | undefined,
    private _revokedAt: Date | undefined,
  ) {}

  static create(data: DirectGuestAccessCreateProps): DirectGuestAccess {
    return new DirectGuestAccess(
      randomUUID(),
      data.organizationId,
      DirectGuestAccess.normalizeEmail(data.email),
      data.guestRole,
      data.grantedBy,
      data.now ?? new Date(),
      undefined,
      undefined,
      undefined,
    );
  }

  static fromPlain(json: unknown): DirectGuestAccess {
    const data = DirectGuestAccessPlainSchema.parse(json);
    return new DirectGuestAccess(
      data.id,
      data.organizationId,
      data.email,
      data.guestRole,
      data.grantedBy,
      data.createdAt,
      data.acceptedByUserId,
      data.acceptedAt,
      data.revokedAt,
    );
  }

  get guestRole(): GuestRoleType {
    return this._guestRole;
  }

  get acceptedByUserId(): string | undefined {
    return this._acceptedByUserId;
  }

  get acceptedAt(): Date | undefined {
    return this._acceptedAt;
  }

  get revokedAt(): Date | undefined {
    return this._revokedAt;
  }

  get status(): GuestAccessStatusType {
    if (this._revokedAt) {
      return GuestAccessStatus.REVOKED;
    }
    return this._acceptedByUserId ? GuestAccessStatus.ACCEPTED : GuestAccessStatus.PENDING;
  }

  isActiveFor(caller: CallerFacts): boolean {
    return this.status === GuestAccessStatus.ACCEPTED && this._acceptedByUserId === caller.userId;
  }

  accept(user: User, now: Date): void {
    if (this._revokedAt) {
      throw new ValueError("A revoked guest access cannot be accepted");
    }
    if (this._acceptedByUserId) {
      throw new ValueError("The guest access is already accepted");
    }
    if (!user.emailVerified || DirectGuestAccess.normalizeEmail(user.email) !== this.email) {
      throw new ValueError("The guest access can only be accepted with the invited verified email");
    }
    this._acceptedByUserId = user.id;
    this._acceptedAt = now;
  }

  changeGuestRole(role: GuestRoleType): void {
    this.modifiableOrFail();
    this._guestRole = role;
  }

  revoke(now: Date): void {
    if (!this._revokedAt) {
      this._revokedAt = now;
    }
  }

  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private modifiableOrFail(): void {
    if (this._revokedAt) {
      throw new ValueError("A revoked guest access cannot be modified");
    }
  }

  toPlain(): DirectGuestAccessPlain {
    return {
      kind: this.kind as typeof GuestAccessKind.DIRECT,
      id: this.id,
      organizationId: this.organizationId,
      email: this.email,
      guestRole: this._guestRole,
      grantedBy: this.grantedBy,
      createdAt: this.createdAt,
      acceptedByUserId: this._acceptedByUserId,
      acceptedAt: this._acceptedAt,
      revokedAt: this._revokedAt,
    };
  }
}
