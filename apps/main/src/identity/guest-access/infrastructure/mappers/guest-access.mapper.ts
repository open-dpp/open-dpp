import { GuestAccess, GuestAccessPlain } from "../../domain/guest-access";
import { guestAccessFromPlain } from "../../domain/guest-access-registry";

export type GuestAccessPersistence = Omit<GuestAccessPlain, "id"> & { _id: string };

export class GuestAccessMapper {
  // Fields that are not set are undefined and therefore not stored in the document.
  static toPersistence(entity: GuestAccess): GuestAccessPersistence {
    const { id, ...rest } = entity.toPlain();
    return { _id: id, ...rest };
  }

  static toDomain(persistence: GuestAccessPersistence): GuestAccess {
    const { _id, ...rest } = persistence;
    return guestAccessFromPlain({ ...rest, id: _id });
  }
}
