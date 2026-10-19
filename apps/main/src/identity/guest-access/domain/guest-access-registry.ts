import { ValueError } from "@open-dpp/exception";
import { DirectGuestAccess } from "./direct-guest-access";
import { GuestAccess } from "./guest-access";
import {
  GuestAccessKind,
  GuestAccessKindEnum,
  GuestAccessKindType,
} from "./guest-access-kind.enum";

interface GuestAccessStatic {
  fromPlain: (data: unknown) => GuestAccess;
}

const registry = new Map<GuestAccessKindType, GuestAccessStatic>([
  [GuestAccessKind.DIRECT, DirectGuestAccess],
]);

export function guestAccessFromPlain(plain: Record<string, unknown>): GuestAccess {
  const kind = GuestAccessKindEnum.safeParse(plain.kind);
  const GuestAccessClass = kind.success ? registry.get(kind.data) : undefined;
  if (!GuestAccessClass) {
    throw new ValueError(`No guest access class registered for kind ${String(plain.kind)}`);
  }
  return GuestAccessClass.fromPlain(plain);
}
