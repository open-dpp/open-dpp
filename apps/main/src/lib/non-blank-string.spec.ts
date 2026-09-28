import { describe, expect, it } from "@jest/globals";

import { isNonBlankString } from "./non-blank-string";

describe("isNonBlankString", () => {
  it.each(["Anna", " Anna ", "0"])("accepts %p", (value: string) => {
    expect(isNonBlankString(value)).toBe(true);
  });

  it.each(["", "   ", "\t\n", null, undefined, 0, {}])("rejects %p", (value: unknown) => {
    expect(isNonBlankString(value)).toBe(false);
  });
});
