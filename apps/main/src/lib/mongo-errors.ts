export const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

export function isDuplicateKeyError(error: unknown): boolean {
  return extractMongoErrorCode(error) === MONGO_DUPLICATE_KEY_ERROR_CODE;
}

/**
 * True only when the duplicate-key error fired on an index over `field`.
 * A collection can carry several unique indexes — mapping every E11000 to one
 * business conflict misattributes collisions on the other indexes.
 */
export function isDuplicateKeyErrorOnField(error: unknown, field: string): boolean {
  if (!isDuplicateKeyError(error)) return false;
  const keyPatterns = extractKeyPatterns(error);
  if (keyPatterns.length > 0) {
    return keyPatterns.some((pattern) => field in pattern);
  }
  // Fallback: the raw server message names the index ("index: <field>_1").
  const message = extractMessage(error);
  return message !== undefined && message.includes(`index: ${field}`);
}

function extractKeyPatterns(error: unknown): Record<string, unknown>[] {
  if (typeof error !== "object" || error === null) return [];
  const asRecord = error as {
    keyPattern?: unknown;
    cause?: { keyPattern?: unknown };
    writeErrors?: ReadonlyArray<{ keyPattern?: unknown }>;
  };
  const candidates = [
    asRecord.keyPattern,
    asRecord.cause?.keyPattern,
    ...(asRecord.writeErrors ?? []).map((w) => w.keyPattern),
  ];
  return candidates.filter(
    (c): c is Record<string, unknown> => typeof c === "object" && c !== null,
  );
}

function extractMessage(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const asRecord = error as { message?: unknown; errmsg?: unknown; cause?: unknown };
  if (typeof asRecord.message === "string") return asRecord.message;
  if (typeof asRecord.errmsg === "string") return asRecord.errmsg;
  if (typeof asRecord.cause === "object" && asRecord.cause !== null) {
    return extractMessage(asRecord.cause);
  }
  return undefined;
}

export function extractMongoErrorCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const asRecord = error as {
    code?: unknown;
    cause?: { code?: unknown };
    writeErrors?: ReadonlyArray<{ code?: unknown }>;
  };
  if (typeof asRecord.code === "number") return asRecord.code;
  if (typeof asRecord.cause?.code === "number") return asRecord.cause.code;
  const writeErrors = asRecord.writeErrors;
  if (writeErrors) {
    if (writeErrors.some((w) => w.code === MONGO_DUPLICATE_KEY_ERROR_CODE)) {
      return MONGO_DUPLICATE_KEY_ERROR_CODE;
    }
    const firstNumeric = writeErrors.find((w) => typeof w.code === "number");
    if (firstNumeric && typeof firstNumeric.code === "number") return firstNumeric.code;
  }
  return undefined;
}
