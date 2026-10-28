import { inspect } from "node:util";
import { jest } from "@jest/globals";
import { Logger } from "@nestjs/common";

/** A question that must never show up in a log line. */
export const CHAT_CONTENT = "What is the battery capacity of my Pacemaker X2?";

const LOG_METHODS = ["log", "error", "warn", "debug", "verbose", "fatal"] as const;

export interface CapturedLogs {
  /** Every argument passed to any Nest `Logger` method, rendered the way a log line would show it. */
  text: () => string;
  restore: () => void;
}

/**
 * Silences every Nest `Logger` instance and records what they were asked to log. Rendering
 * uses `inspect` rather than `JSON.stringify`, which would print a logged `Error` as `{}`
 * and hide the message it carries.
 */
export function captureLogs(): CapturedLogs {
  const spies = LOG_METHODS.map((method) =>
    jest.spyOn(Logger.prototype, method).mockImplementation(() => undefined),
  );
  return {
    text: () =>
      inspect(
        spies.flatMap((spy) => spy.mock.calls),
        { depth: Infinity, breakLength: Infinity, maxStringLength: Infinity },
      ),
    restore: () => spies.forEach((spy) => spy.mockRestore()),
  };
}
