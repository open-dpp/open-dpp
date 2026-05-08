import { AdministrativeInformation } from "./administrative-information";

describe("AdministrativeInformation", () => {
  it("should increase version", () => {
    const ai = AdministrativeInformation.create({ version: "1", revision: "0" });
    expect(ai.version).toBe("1");
    ai.increaseVersion();
    expect(ai.version).toBe("2");
  });
});
