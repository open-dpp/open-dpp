import { describe, expect, it } from "@jest/globals";
import { fillMissingDisplayName } from "./user-display-name-hook";

describe("fillMissingDisplayName", () => {
  it("keeps a display name the caller sent", () => {
    const user = { name: "Jane Roe", firstName: "Jane", lastName: "Doe" };

    expect(fillMissingDisplayName(user)).toEqual({
      data: { name: "Jane Roe", firstName: "Jane", lastName: "Doe" },
    });
  });

  it("derives the display name from first and last name when none was sent", () => {
    expect(fillMissingDisplayName({ name: "", firstName: "Solo", lastName: "Rider" })).toEqual({
      data: { name: "Solo Rider", firstName: "Solo", lastName: "Rider" },
    });
    expect(fillMissingDisplayName({ firstName: "Solo", lastName: "Rider" })).toEqual({
      data: { name: "Solo Rider", firstName: "Solo", lastName: "Rider" },
    });
  });

  it("uses whichever name part exists", () => {
    expect(fillMissingDisplayName({ name: "  ", firstName: "Solo", lastName: null })).toEqual({
      data: { name: "Solo", firstName: "Solo", lastName: null },
    });
  });

  it("falls back to a stable display name when nothing can be derived", () => {
    const user = { name: "", firstName: null, lastName: undefined };

    const result = fillMissingDisplayName(user);

    expect(result).toEqual({ data: { name: "User", firstName: null, lastName: undefined } });
    expect(result.data).not.toBe(user);
    expect(user).toEqual({ name: "", firstName: null, lastName: undefined });
  });

  it("falls back when the name fields are blank or missing altogether", () => {
    expect(fillMissingDisplayName({ firstName: "", lastName: "  " })).toEqual({
      data: { name: "User", firstName: "", lastName: "  " },
    });
    expect(fillMissingDisplayName({ name: null })).toEqual({ data: { name: "User" } });
  });
});
