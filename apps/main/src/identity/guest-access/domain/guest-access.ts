import { GuestAccessKindType, GuestAccessStatusType } from "./guest-access-kind.enum";
import { GuestRoleType } from "./guest-role.enum";

/**
 * Facts about the caller that a guest access is matched against. Kept small on purpose:
 * further access kinds (organization, credential) extend it with their own facts.
 */
export interface CallerFacts {
  userId: string;
}

/**
 * What authorization depends on. Each access kind (e.g. DirectGuestAccess) is a separate class
 * with its own lifecycle and fields.
 */
export interface GuestAccess {
  readonly kind: GuestAccessKindType;
  readonly id: string;
  readonly organizationId: string;
  readonly grantedBy: string;
  readonly createdAt: Date;
  readonly guestRole: GuestRoleType;
  readonly revokedAt: Date | undefined;
  readonly status: GuestAccessStatusType;
  isActiveFor: (caller: CallerFacts) => boolean;
  revoke: (now: Date) => void;
  toPlain: () => Record<string, unknown>;
}
