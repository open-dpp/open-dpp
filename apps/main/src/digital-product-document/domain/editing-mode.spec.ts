import { describe, expect, it } from "vitest";
import {
  assertModeAllowsDataEdit,
  assertModeAllowsStructureEdit,
  EditingMode,
} from "./editing-mode";

describe("editing mode assertions", () => {
  it("allows structure and data edits in Full mode", () => {
    expect(() => assertModeAllowsStructureEdit(EditingMode.Full, "Thing 1")).not.toThrow();
    expect(() => assertModeAllowsDataEdit(EditingMode.Full, "Thing 1")).not.toThrow();
  });

  it("allows only data edits in DataOnly mode", () => {
    expect(() => assertModeAllowsStructureEdit(EditingMode.DataOnly, "Thing 1")).toThrow(
      "Thing 1 editing is restricted to data; structural changes are not allowed",
    );
    expect(() => assertModeAllowsDataEdit(EditingMode.DataOnly, "Thing 1")).not.toThrow();
  });

  it("allows no edits in ReadOnly mode", () => {
    expect(() => assertModeAllowsStructureEdit(EditingMode.ReadOnly, "Thing 1")).toThrow(
      "Thing 1 is read-only; changes are not allowed",
    );
    expect(() => assertModeAllowsDataEdit(EditingMode.ReadOnly, "Thing 1")).toThrow(
      "Thing 1 is read-only; changes are not allowed",
    );
  });
});
