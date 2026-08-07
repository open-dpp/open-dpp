import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { RAW_GTIN13 } from "./gtin.fixtures";

interface CreateRequestTransient {
  /** GS1 batch (AI 10) to include in the request */
  batch?: string;
  /** GS1 serial (AI 21) to include in the request */
  serial?: string;
}

/**
 * The raw (pre-parse) shape of a create request before Zod transforms it.
 * gtin is a raw GTIN-13 string (not yet normalized to GTIN-14).
 */
interface CreateRequestRaw {
  referenceId: string;
  gtin: string;
  batch?: string;
  serial?: string;
}

/** Fishery factory for a raw CreateGs1UniqueProductIdentifierRequest (un-normalized GTIN-13). */
export const uniqueProductIdentifierCreateRequestPlainFactory = Factory.define<
  CreateRequestRaw,
  CreateRequestTransient
>(({ transientParams }) => ({
  referenceId: randomUUID(),
  gtin: RAW_GTIN13,
  ...(transientParams.batch !== undefined && { batch: transientParams.batch }),
  ...(transientParams.serial !== undefined && { serial: transientParams.serial }),
}));
