/** One-line description of anything a `catch` can receive, for log lines and error messages. */
export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
