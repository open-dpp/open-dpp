import {
  type GuestAccessInvitationDto,
  GuestAccessInvitationDtoSchema,
  type GuestAccessResponseDto,
  GuestAccessResponseDtoSchema,
} from "@open-dpp/dto";
import { DirectGuestAccess } from "../domain/direct-guest-access";
import { GuestAccess } from "../domain/guest-access";

export function toGuestAccessResponseDto(guestAccess: GuestAccess): GuestAccessResponseDto {
  const plain = guestAccess.toPlain();
  return GuestAccessResponseDtoSchema.parse({
    kind: plain.kind,
    id: plain.id,
    organizationId: plain.organizationId,
    email: plain.email,
    guestRole: plain.guestRole,
    grantedBy: plain.grantedBy,
    status: guestAccess.status,
    createdAt: plain.createdAt.toISOString(),
    acceptedByUserId: plain.acceptedByUserId,
    acceptedAt: plain.acceptedAt?.toISOString(),
    revokedAt: plain.revokedAt?.toISOString(),
  });
}

export function toGuestAccessInvitationDto(
  guestAccess: DirectGuestAccess,
  organizationName: string,
): GuestAccessInvitationDto {
  return GuestAccessInvitationDtoSchema.parse({
    id: guestAccess.id,
    organizationName,
    email: guestAccess.email,
    guestRole: guestAccess.guestRole,
    status: guestAccess.status,
  });
}
