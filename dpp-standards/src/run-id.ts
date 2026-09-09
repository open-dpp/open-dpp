/** Run ids: `<date>-<slug>`, the slug naming the trigger's scope, a numeric suffix on collision. */
import type { ScopeRequest } from "./scope";

const slugOf = (request: ScopeRequest): string => {
  switch (request.kind) {
    case "text":
      return request.sources.map((s) => s.toLowerCase()).join("+");
    case "code":
      return request.sources ? request.sources.map((s) => s.toLowerCase()).join("+") : "all";
    case "check":
      return "check";
    case "manual":
      return "manual";
  }
};

export const newRunId = (
  date: string,
  request: ScopeRequest,
  existing: readonly string[],
): string => {
  const base = `${date}-${slugOf(request)}`;
  const taken = new Set(existing);
  if (!taken.has(base)) {
    return base;
  }
  const next = [2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${base}-${n}`).find((id) => !taken.has(id));
  if (!next) {
    throw new Error(`too many runs with id ${base} on one day`);
  }
  return next;
};
