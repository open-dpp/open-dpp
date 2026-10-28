import type { LoggerService } from "@nestjs/common";

/**
 * Logs an error from the chat pipeline as `<context>: <error name>` with its stack frames.
 * The message is dropped because LangChain and provider errors can quote the user's
 * question or the model's answer, and chat content must never reach the logs.
 */
export function logChatError(logger: LoggerService, context: string, err: unknown): void {
  if (!(err instanceof Error)) {
    logger.error(`${context}: ${typeof err}`);
    return;
  }
  logger.error(`${context}: ${err.name}`, stackFrames(err));
}

/**
 * The stack without its header. V8 writes `name: message` (which may span several lines) as
 * the header the first time `stack` is read, so it is only stripped when it still matches
 * the error; otherwise the stack is dropped rather than risk printing an older message.
 */
function stackFrames(err: Error): string | undefined {
  const header = `${Error.prototype.toString.call(err)}\n`;
  if (typeof err.stack !== "string" || !err.stack.startsWith(header)) {
    return undefined;
  }
  return err.stack.slice(header.length);
}
