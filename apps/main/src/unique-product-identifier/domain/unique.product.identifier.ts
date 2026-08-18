import { randomUUID } from "node:crypto";
import {
  baseUrlOrigin,
  buildGs1DigitalLink,
  buildGs1DigitalLinkPath,
  type Gs1IdentityResponse,
  Gs1IdentityDtoSchema,
  isValidCset82Component,
  normalizeToGtin14,
  type PermalinkKindType,
  UniqueProductIdentifierType,
  type UniqueProductIdentifierTypeValue,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

export interface Gs1Identity {
  readonly gtin: string;
  readonly batch?: string;
  readonly serial?: string;
}

export interface Gs1IdentityInput {
  gtin: string;
  batch?: string | null;
  serial?: string | null;
}

function normalizeGtinOrThrow(rawGtin: string): string {
  try {
    return normalizeToGtin14(rawGtin);
  } catch (error) {
    throw new ValueError(error instanceof Error ? error.message : "Invalid GTIN");
  }
}

function normalizeOptionalComponentOrThrow(
  value: string | null | undefined,
  label: string,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!isValidCset82Component(trimmed)) {
    throw new ValueError(
      `${label} must contain only GS1 CSET-82 characters and be at most 20 characters`,
    );
  }
  return trimmed;
}

function assembleGs1Identity(
  gtin: string,
  batch: string | null | undefined,
  serial: string | null | undefined,
): Gs1Identity {
  return {
    gtin,
    ...(batch !== null && batch !== undefined ? { batch } : {}),
    ...(serial !== null && serial !== undefined ? { serial } : {}),
  };
}

function normalizeGs1Identity(input: Gs1IdentityInput): Gs1Identity {
  const gtin = normalizeGtinOrThrow(input.gtin);
  const batch = normalizeOptionalComponentOrThrow(input.batch, "Batch");
  const serial = normalizeOptionalComponentOrThrow(input.serial, "Serial");
  return assembleGs1Identity(gtin, batch, serial);
}

/**
 * Canonical, exact-match lookup value for a GS1 identity: the Digital-Link path
 * `01/{gtin14}[/10/{batch}][/21/{serial}]` with percent-encoded components.
 * Percent-encoding keeps the form unambiguous — CSET-82 allows "/", so an
 * unencoded serialization could collide
 * (e.g. batch "ABC/21/7" vs batch "ABC" + serial "7").
 *
 * @throws ValueError when the GTIN or a batch/serial component is invalid.
 */
export function canonicalGs1Value(input: Gs1IdentityInput): string {
  try {
    return buildGs1DigitalLinkPath(input);
  } catch (error) {
    throw new ValueError(error instanceof Error ? error.message : "Invalid GS1 identity");
  }
}

export class UniqueProductIdentifier {
  public readonly uuid: string;
  public readonly referenceId: string;
  public readonly type: UniqueProductIdentifierTypeValue;
  public readonly gs1?: Gs1Identity;
  public readonly organizationId: string | null;

  private constructor(
    uuid: string,
    referenceId: string,
    type: UniqueProductIdentifierTypeValue,
    gs1?: Gs1Identity,
    organizationId: string | null = null,
  ) {
    this.uuid = uuid;
    this.referenceId = referenceId;
    this.type = type;
    this.gs1 = gs1;
    this.organizationId = organizationId;
    this.assertInvariants();
  }

  private assertInvariants(): void {
    if (this.type === UniqueProductIdentifierType.GS1) {
      if (!this.gs1) {
        throw new ValueError("A GS1 unique product identifier must carry a GS1 identity (gtin)");
      }
      Gs1IdentityDtoSchema.parse(this.gs1);
    } else if (this.gs1) {
      throw new ValueError(
        `A unique product identifier of type ${this.type} must not carry a GS1 identity`,
      );
    }
  }

  static create(data: {
    externalUUID?: string;
    referenceId: string;
    type?: UniqueProductIdentifierTypeValue;
    organizationId?: string | null;
  }): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      data.externalUUID ?? randomUUID(),
      data.referenceId,
      data.type ?? UniqueProductIdentifierType.OPEN_DPP_UUID,
      undefined,
      data.organizationId ?? null,
    );
  }

  static createGs1(data: {
    externalUUID?: string;
    referenceId: string;
    gtin: string;
    batch?: string | null;
    serial?: string | null;
    organizationId?: string | null;
  }): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      data.externalUUID ?? randomUUID(),
      data.referenceId,
      UniqueProductIdentifierType.GS1,
      normalizeGs1Identity(data),
      data.organizationId ?? null,
    );
  }

  static loadFromDb(data: {
    uuid: string;
    referenceId: string;
    type?: UniqueProductIdentifierTypeValue | null;
    gtin?: string | null;
    batch?: string | null;
    serial?: string | null;
    organizationId?: string | null;
  }) {
    const type = data.type ?? UniqueProductIdentifierType.OPEN_DPP_UUID;
    const gs1 =
      data.gtin !== null && data.gtin !== undefined
        ? assembleGs1Identity(data.gtin, data.batch, data.serial)
        : undefined;
    return new UniqueProductIdentifier(
      data.uuid,
      data.referenceId,
      type,
      gs1,
      data.organizationId ?? null,
    );
  }

  withOrganizationId(organizationId: string): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      this.uuid,
      this.referenceId,
      this.type,
      this.gs1,
      organizationId,
    );
  }

  withGs1(input: Gs1IdentityInput): UniqueProductIdentifier {
    return new UniqueProductIdentifier(
      this.uuid,
      this.referenceId,
      UniqueProductIdentifierType.GS1,
      normalizeGs1Identity(input),
      this.organizationId,
    );
  }

  /**
   * Canonical exact-match value for this identifier: the Digital-Link path for
   * a GS1 identity, the entity's own uuid otherwise.
   */
  get canonicalValue(): string {
    return this.gs1 ? canonicalGs1Value(this.gs1) : this.uuid;
  }

  get granularity(): "model" | "batch" | "item" | null {
    if (!this.gs1) {
      return null;
    }
    if (this.gs1.serial !== undefined) {
      return "item";
    }
    if (this.gs1.batch !== undefined) {
      return "batch";
    }
    return "model";
  }

  buildDigitalLink(resolverBase: string): string {
    if (!this.gs1) {
      throw new ValueError(
        "Cannot build a GS1 Digital Link for a unique product identifier without a GS1 identity",
      );
    }
    return buildGs1DigitalLink(baseUrlOrigin(resolverBase), {
      gtin: this.gs1.gtin,
      batch: this.gs1.batch,
      serial: this.gs1.serial,
    });
  }

  toGs1Response(resolverBase: string): Gs1IdentityResponse {
    if (!this.gs1) {
      throw new ValueError(
        "Cannot build a GS1 identity response for a unique product identifier without a GS1 identity",
      );
    }
    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      gtin: this.gs1.gtin,
      batch: this.gs1.batch ?? null,
      serial: this.gs1.serial ?? null,
      digitalLink: this.buildDigitalLink(resolverBase),
    };
  }

  toListItem({
    resolverBase,
    passportPublished,
    permalink = null,
  }: {
    resolverBase?: string;
    passportPublished: boolean;
    permalink?: { id: string; kind: PermalinkKindType; publicUrl: string } | null;
  }) {
    const digitalLink = this.gs1 && resolverBase ? this.buildDigitalLink(resolverBase) : null;

    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      type: this.type,
      gtin: this.gs1?.gtin ?? null,
      batch: this.gs1?.batch ?? null,
      serial: this.gs1?.serial ?? null,
      granularity: this.granularity,
      digitalLink,
      passportPublished,
      permalink,
    };
  }

  toPlain() {
    return {
      uuid: this.uuid,
      referenceId: this.referenceId,
      type: this.type,
      gtin: this.gs1?.gtin ?? null,
      batch: this.gs1?.batch ?? null,
      serial: this.gs1?.serial ?? null,
      organizationId: this.organizationId,
    };
  }
}
