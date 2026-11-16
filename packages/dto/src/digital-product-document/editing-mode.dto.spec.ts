import { describe, expect, it } from "vitest";
import { EditingModeDto, EditingModeDtoEnum, PassportEditingModeDtoEnum } from "./editing-mode.dto";

describe("editing mode dto", () => {
  it("accepts every mode for a document in general", () => {
    for (const mode of Object.values(EditingModeDto)) {
      expect(EditingModeDtoEnum.parse(mode)).toBe(mode);
    }
  });

  it("does not accept ReadOnly for a passport", () => {
    expect(PassportEditingModeDtoEnum.parse(EditingModeDto.Full)).toBe(EditingModeDto.Full);
    expect(PassportEditingModeDtoEnum.parse(EditingModeDto.DataOnly)).toBe(EditingModeDto.DataOnly);
    expect(PassportEditingModeDtoEnum.safeParse(EditingModeDto.ReadOnly).success).toBe(false);
  });
});
