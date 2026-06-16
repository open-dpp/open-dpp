import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";

/**
 * Known-valid GTIN-14 used by the GS1 transient (check digit verified).
 * "04006381333931" is a real GTIN-14 with a valid check digit.
 */
const KNOWN_VALID_GTIN14 = "04006381333931";

interface UniqueProductIdentifierTransient {
  /** Set to true to produce a GS1 row with a valid GTIN-14 */
  gs1?: boolean;
  /** GS1 batch (AI 10); only used when gs1=true */
  batch?: string;
  /** GS1 serial (AI 21); only used when gs1=true */
  serial?: string;
}

/**
 * Fishery factory for a UniqueProductIdentifierListItemDto.
 *
 * Default output: an OPEN_DPP_UUID (system) row with gtin=null.
 *
 * Transient params:
 * - `gs1: true`     — produce a GS1 row with a known-valid GTIN-14
 * - `batch: string` — include a batch qualifier (only when gs1=true)
 * - `serial: string`— include a serial qualifier (only when gs1=true)
 *
 * `referenceId` is always overridable via the params object.
 */
export const uniqueProductIdentifierPlainFactory = Factory.define<
  UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierTransient
>(({ params, transientParams }) => {
  const referenceId =
    params.referenceId !== undefined ? params.referenceId : randomUUID();

  if (transientParams.gs1 === true) {
    const batch =
      transientParams.batch !== undefined
        ? transientParams.batch
        : (params.batch !== undefined ? params.batch : null);

    const serial =
      transientParams.serial !== undefined
        ? transientParams.serial
        : (params.serial !== undefined ? params.serial : null);

    const granularity = serial !== null ? "item" : batch !== null ? "batch" : "model";

    return {
      uuid: randomUUID(),
      referenceId,
      type: "GS1",
      gtin: KNOWN_VALID_GTIN14,
      batch,
      serial,
      granularity,
      digitalLink: null,
      passportPublished: false,
    };
  }

  return {
    uuid: randomUUID(),
    referenceId,
    type: "OPEN_DPP_UUID",
    gtin: null,
    batch: null,
    serial: null,
    granularity: null,
    digitalLink: null,
    passportPublished: false,
  };
});
