import type { LogLevel } from "@nestjs/common";

// Ordered from most to least severe.
export const LOG_LEVELS: LogLevel[] = ["fatal", "error", "warn", "log", "debug", "verbose"];

export function logLevelsUpTo(level: LogLevel): LogLevel[] {
  return LOG_LEVELS.slice(0, LOG_LEVELS.indexOf(level) + 1);
}
