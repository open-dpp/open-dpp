import type { LoggerService } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { logChatError } from "./chat-error-log";
import { CHAT_CONTENT } from "./chat-logs.test-helpers";

function loggerSpy() {
  const error = vi.fn<LoggerService["error"]>();
  return { logger: { error, log: vi.fn(), warn: vi.fn() } as LoggerService, error };
}

describe("logChatError", () => {
  it("logs the error name and stack frames but never the message", () => {
    const { logger, error } = loggerSpy();

    logChatError(logger, "Chain Error", new Error(`Provider rejected: ${CHAT_CONTENT}`));

    const [message, stack] = error.mock.calls[0];
    expect(message).toBe("Chain Error: Error");
    expect(stack).toMatch(/^\s+at /);
    expect(JSON.stringify(error.mock.calls)).not.toContain(CHAT_CONTENT);
  });

  it("strips a message that spans several lines", () => {
    const { logger, error } = loggerSpy();

    logChatError(logger, "Chain Error", new Error(`Provider rejected:\n    at ${CHAT_CONTENT}`));

    expect(error.mock.calls[0][1]).toMatch(/^\s+at /);
    expect(JSON.stringify(error.mock.calls)).not.toContain(CHAT_CONTENT);
  });

  it("keeps the name a subclass assigns after construction", () => {
    class ProviderError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "ProviderError";
      }
    }
    const { logger, error } = loggerSpy();

    logChatError(logger, "LLMError", new ProviderError(CHAT_CONTENT));

    expect(error.mock.calls[0][0]).toBe("LLMError: ProviderError");
    expect(error.mock.calls[0][1]).toMatch(/^\s+at /);
    expect(JSON.stringify(error.mock.calls)).not.toContain(CHAT_CONTENT);
  });

  it("drops the stack when it was rendered with an earlier message", () => {
    const err = new Error(CHAT_CONTENT);
    void err.stack;
    err.message = "redacted";
    const { logger, error } = loggerSpy();

    logChatError(logger, "Chain Error", err);

    expect(error).toHaveBeenCalledWith("Chain Error: Error", undefined);
  });

  it("logs only the type of a thrown non-Error", () => {
    const { logger, error } = loggerSpy();

    logChatError(logger, "Unknown error in chat handler", CHAT_CONTENT);

    expect(error).toHaveBeenCalledWith("Unknown error in chat handler: string");
  });
});
