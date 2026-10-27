/**
 * Reduces an error from the chat pipeline to what may be logged: its name and stack frames.
 * The message is dropped because LangChain and provider errors can quote the user's
 * question or the model's answer, and chat content must never reach the logs.
 */
export function chatErrorForLog(err: unknown): { name: string; stack?: string } {
  if (!(err instanceof Error)) {
    return { name: typeof err };
  }
  return { name: err.name, stack: err.stack?.split("\n").slice(1).join("\n") };
}
