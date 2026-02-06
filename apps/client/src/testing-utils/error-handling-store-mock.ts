import type { ErrorHandlingOptionsAsync, ErrorHandlingOptionsSync } from "../stores/error.handling.ts";
import { vi } from "vitest";

export function generatedErrorHandlingStoreMock() {
  return {
    logErrorWithNotification: vi.fn(),
    withErrorHandlingAsync: async <T>(
      callback: () => Promise<T>,
      _options: ErrorHandlingOptionsAsync,
    ) => {
      await callback();
    },
    withErrorHandlingSync: <T>(
      callback: () => T,
      _options: ErrorHandlingOptionsSync,
    ) => {
      callback();
    },
  };
}
