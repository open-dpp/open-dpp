import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { GTIN14 } from "./gtin.fixtures";

interface UniqueProductIdentifierTransient {
  /** Set to true to produce a GS1 row with a valid GTIN-14 */
  gs1?: boolean;
  /** GS1 batch (AI 10); only used when gs1=true */
  batch?: string;
  /** GS1 serial (AI 21); only used when gs1=true */
  serial?: string;
}

/** Fishery factory for a UniqueProductIdentifierListItemDto (OPEN_DPP_UUID row by default; gs1 transient for a GS1 row). */
export const uniqueProductIdentifierPlainFactory = Factory.define<
  UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierTransient
>(({ params, transientParams }) => {
  if (transientParams.gs1 === true) {
    const batch =
      transientParams.batch !== undefined
        ? transientParams.batch
        : params.batch !== undefined
          ? params.batch
          : null;

    const serial =
      transientParams.serial !== undefined
        ? transientParams.serial
        : params.serial !== undefined
          ? params.serial
          : null;

    const granularity = serial !== null ? "item" : batch !== null ? "batch" : "model";

    return {
      uuid: randomUUID(),
      referenceId: randomUUID(),
      type: "GS1",
      gtin: GTIN14,
      batch,
      serial,
      granularity,
      digitalLink: null,
      passportPublished: false,
    };
  }

  return {
    uuid: randomUUID(),
    referenceId: randomUUID(),
    type: "OPEN_DPP_UUID",
    gtin: null,
    batch: null,
    serial: null,
    granularity: null,
    digitalLink: null,
    passportPublished: false,
  };
});
