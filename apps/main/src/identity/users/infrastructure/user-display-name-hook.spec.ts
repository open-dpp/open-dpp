import { describe, expect, it } from "@jest/globals";
import { withDisplayName } from "./user-display-name-hook";

describe("withDisplayName", () => {
  it("keeps a display name the caller sent", () => {
    const user = { name: "Jane Roe", firstName: "Jane", lastName: "Doe" };

    expect(withDisplayName(user)).toEqual({
      data: { name: "Jane Roe", firstName: "Jane", lastName: "Doe" },
    });
  });

  it("derives the display name from first and last name when none was sent", () => {
    expect(withDisplayName({ name: "", firstName: "Solo", lastName: "Rider" })).toEqual({
      data: { name: "Solo Rider", firstName: "Solo", lastName: "Rider" },
    });
    expect(withDisplayName({ firstName: "Solo", lastName: "Rider" })).toEqual({
      data: { name: "Solo Rider", firstName: "Solo", lastName: "Rider" },
    });
  });

  it("uses whichever name part exists", () => {
    expect(withDisplayName({ name: "  ", firstName: "Solo", lastName: null })).toEqual({
      data: { name: "Solo", firstName: "Solo", lastName: null },
    });
  });

  it("leaves the user untouched when nothing can be derived", () => {
    const user = { name: "", firstName: null, lastName: undefined };

    const result = withDisplayName(user);

    expect(result).toEqual({ data: user });
    expect(result.data).not.toBe(user);
  });
});
