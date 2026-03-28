import { Status } from "./status";

describe("Status", () => {
  it("should create a Status with the given version", () => {
    const status = Status.create({ version: "1.2.3" });
    expect(status.version).toBe("1.2.3");
  });

  it("should serialize to plain object via toPlain()", () => {
    const status = Status.create({ version: "0.1.0" });
    expect(status.toPlain()).toEqual({ version: "0.1.0" });
  });
});
