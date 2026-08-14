import { ValueError } from "./domain.errors";

interface SafeParseable<T> {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: any };
}

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
