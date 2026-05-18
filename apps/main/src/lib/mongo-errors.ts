export const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

export function isDuplicateKeyError(error: unknown): boolean {
  return extractMongoErrorCode(error) === MONGO_DUPLICATE_KEY_ERROR_CODE;
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
