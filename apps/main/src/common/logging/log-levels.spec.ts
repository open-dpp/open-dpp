import { describe, expect, it } from "vitest";
import { logLevelsUpTo } from "./log-levels";

describe("logLevelsUpTo", () => {
  it("still prints fatal logs at the fatal level", () => {
    expect(logLevelsUpTo("fatal")).toEqual(["fatal"]);
  });

  it("includes every more severe level", () => {
    expect(logLevelsUpTo("debug")).toEqual(["fatal", "error", "warn", "log", "debug"]);
  });

  it("prints everything at verbose", () => {
    expect(logLevelsUpTo("verbose")).toEqual(["fatal", "error", "warn", "log", "debug", "verbose"]);
  });
});
