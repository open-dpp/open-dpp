import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { RAW_GTIN13 } from "./gtin.fixtures";

interface CreateRequestTransient {
  batch?: string;
  serial?: string;
}

interface CreateRequestRaw {
  referenceId: string;
  gtin: string;
  batch?: string;
  serial?: string;
}

export const uniqueProductIdentifierCreateRequestPlainFactory = Factory.define<
  CreateRequestRaw,
  CreateRequestTransient
>(({ transientParams }) => ({
  referenceId: randomUUID(),
  gtin: RAW_GTIN13,
  ...(transientParams.batch !== undefined && { batch: transientParams.batch }),
  ...(transientParams.serial !== undefined && { serial: transientParams.serial }),
}));
