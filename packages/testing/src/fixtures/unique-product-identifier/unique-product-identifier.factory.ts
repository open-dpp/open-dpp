import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { GTIN14 } from "./gtin.fixtures";

interface UniqueProductIdentifierTransient {
  gs1?: boolean;
  batch?: string;
  serial?: string;
}

export const uniqueProductIdentifierPlainFactory = Factory.define<
  UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierTransient
>(({ params, transientParams }) => {
  if (transientParams.gs1 === true) {
    const batch = transientParams.batch ?? params.batch ?? null;
    const serial = transientParams.serial ?? params.serial ?? null;

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
      permalink: null,
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
    permalink: null,
  };
});
