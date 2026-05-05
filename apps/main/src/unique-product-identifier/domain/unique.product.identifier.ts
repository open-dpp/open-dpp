import { randomUUID } from "node:crypto";
import {
  ExternalIdentifierType,
  type ExternalIdentifierTypeValue,
} from "../presentation/dto/unique-product-identifier-dto.schema";

export class UniqueProductIdentifier {
  public readonly uuid: string;
  public readonly referenceId: string;
  // Discriminator for the registry / scheme this identifier belongs to.
  // Defaults to OPEN_DPP_UUID for server-generated identifiers and for any
  // legacy row that predates the multi-registry design. See
  // ExternalIdentifierType for the full set.
  public readonly type: ExternalIdentifierTypeValue;

  private constructor(uuid: string, referenceId: string, type: ExternalIdentifierTypeValue) {
    this.uuid = uuid;
    this.referenceId = referenceId;
    this.type = type;
  }

  static create(data: {
    externalUUID?: string;
    referenceId: string;
    type?: ExternalIdentifierTypeValue;
  }): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      data.externalUUID ?? randomUUID(),
      data.referenceId,
      data.type ?? ExternalIdentifierType.OPEN_DPP_UUID,
    );
  }

  static loadFromDb(data: {
    uuid: string;
    referenceId: string;
    type?: ExternalIdentifierTypeValue | null;
  }) {
    return new UniqueProductIdentifier(
      data.uuid,
      data.referenceId,
      data.type ?? ExternalIdentifierType.OPEN_DPP_UUID,
    );
  }

  toPlain() {
    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      type: this.type,
    };
  }
}
