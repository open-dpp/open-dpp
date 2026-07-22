import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { BulkImportProductLink } from "./bulk-import-product-link";

describe("BulkImportProductLink", () => {
  it("round-trips through toPlain/fromPlain", () => {
    const link = BulkImportProductLink.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      externalIdValue: "4711",
      passportId: randomUUID(),
    });
    const restored = BulkImportProductLink.fromPlain(link.toPlain());
    expect(restored.toPlain()).toEqual(link.toPlain());
  });
});
