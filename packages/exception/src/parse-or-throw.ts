import { ValueError } from "./domain.errors";

/**
 * Minimal structural shape of a Zod schema — decoupled from a specific Zod
 * version, mirroring ZodValidationPipe's `SafeParseable`.
 */
interface SafeParseable<T> {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: any };
}

/**
 * Validate `value` against `schema`, returning the parsed value on success or
 * throwing a {@link ValueError} on failure.
 *
 * The thrown message is `Invalid <label>: <path>: <message>` with multiple
 * issues joined by `; ` and the original error attached as `cause`. This is the
 * single home for the zod-issues → `ValueError` formatting that was previously
 * copy-pasted across the permalink / presentation-configuration domains.
 */
export function parseOrThrow<T>(schema: SafeParseable<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  const details = result.error.issues.map(
    (issue: { path: PropertyKey[]; message: string }) =>
      `${issue.path.join(".")}: ${issue.message}`,
  );
  throw new ValueError(`Invalid ${label}: ${details.join("; ")}`, { cause: result.error });
}
