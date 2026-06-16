import { randomUUID } from "node:crypto";
import { Factory } from "fishery";

/**
 * Raw GTIN-13 used by default in the create request factory.
 * This is intentionally UN-normalized (13 digits) to exercise the GtinInputSchema
 * transform, which normalizes it to the GTIN-14 "04006381333931".
 * Valid check digit verified.
 */
const RAW_GTIN13 = "4006381333931";

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

/**
 * Fishery factory for a raw CreateGs1UniqueProductIdentifierRequest.
 *
 * Emits UN-normalized input values (raw GTIN-13) to exercise the input transforms
 * in CreateGs1UniqueProductIdentifierRequestSchema. Parsing the result through the
 * schema normalizes gtin to GTIN-14, trims batch/serial, and coerces blank values
 * to undefined.
 *
 * Transient params:
 * - `batch: string`  — include a batch qualifier
 * - `serial: string` — include a serial qualifier
 *
 * `referenceId` is always overridable via the params object.
 */
export const uniqueProductIdentifierCreateRequestPlainFactory = Factory.define<
  CreateRequestRaw,
  CreateRequestTransient
>(({ params, transientParams }) => {
  const referenceId =
    params.referenceId !== undefined ? params.referenceId : randomUUID();

  const result: CreateRequestRaw = {
    referenceId,
    gtin: RAW_GTIN13,
  };

  const batch =
    transientParams.batch !== undefined
      ? transientParams.batch
      : params.batch;

  const serial =
    transientParams.serial !== undefined
      ? transientParams.serial
      : params.serial;

  if (batch !== undefined) {
    result.batch = batch;
  }

  if (serial !== undefined) {
    result.serial = serial;
  }

  return result;
});
