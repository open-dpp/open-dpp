/** Turns the shared CLI flags of `matrix:affected` and `matrix:run` into a ScopeRequest. */
import type { ScopeRequest } from "./scope";
import { TRIGGER_KINDS, type TriggerKind } from "./schema-runs";

export const SCOPE_OPTIONS = {
  trigger: { type: "string" },
  sources: { type: "string" },
  commit: { type: "string" },
  check: { type: "string" },
  criteria: { type: "string" },
} as const;

export type ScopeFlags = {
  trigger?: string;
  sources?: string;
  commit?: string;
  check?: string;
  criteria?: string;
};

const list = (value: string | undefined): string[] | undefined =>
  value === undefined || value === "all"
    ? undefined
    : value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

const required = (value: string[] | undefined, flag: string): string[] => {
  if (!value || value.length === 0) {
    throw new Error(`--${flag} is required for this trigger`);
  }
  return value;
};

const isTrigger = (value: string | undefined): value is TriggerKind =>
  TRIGGER_KINDS.includes(value as TriggerKind);

/** `defaultCommit` is consulted only when a code trigger names no commit. */
export const parseScopeRequest = (flags: ScopeFlags, defaultCommit: () => string): ScopeRequest => {
  if (!isTrigger(flags.trigger)) {
    throw new Error(`--trigger must be one of ${TRIGGER_KINDS.join(", ")}`);
  }
  switch (flags.trigger) {
    case "text":
      return { kind: "text", sources: required(list(flags.sources), "sources") };
    case "code":
      return {
        kind: "code",
        commit: flags.commit ?? defaultCommit(),
        sources: list(flags.sources),
      };
    case "check":
      return { kind: "check", checkIds: required(list(flags.check), "check") };
    case "manual":
      return { kind: "manual", criteria: required(list(flags.criteria), "criteria") };
  }
};
