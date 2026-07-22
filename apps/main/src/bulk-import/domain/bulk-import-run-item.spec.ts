import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { BulkImportRunItemStatusDto } from "@open-dpp/dto";
import { BulkImportRunItem } from "./bulk-import-run-item";

describe("BulkImportRunItem", () => {
  function buildItem() {
    return BulkImportRunItem.create({
      runId: randomUUID(),
      rowIndex: 0,
      inputData: { sku: "4711" },
    });
  }

  it("starts as pending", () => {
    const item = buildItem();
    expect(item.status).toEqual(BulkImportRunItemStatusDto.Pending);
    expect(item.passportId).toBeNull();
  });

  it("marks a newly created passport", () => {
    const item = buildItem();
    const passportId = randomUUID();
    item.markCreated(passportId);
    expect(item.status).toEqual(BulkImportRunItemStatusDto.Created);
    expect(item.passportId).toEqual(passportId);
  });

  it("marks an updated passport", () => {
    const item = buildItem();
    const passportId = randomUUID();
    item.markUpdated(passportId);
    expect(item.status).toEqual(BulkImportRunItemStatusDto.Updated);
    expect(item.passportId).toEqual(passportId);
  });

  it("marks a failure with its error message", () => {
    const item = buildItem();
    item.markFailed("id field is missing");
    expect(item.status).toEqual(BulkImportRunItemStatusDto.Failed);
    expect(item.error).toEqual("id field is missing");
  });

  it("round-trips through toPlain/fromPlain", () => {
    const item = buildItem();
    item.markCreated(randomUUID());
    const restored = BulkImportRunItem.fromPlain(item.toPlain());
    expect(restored.toPlain()).toEqual(item.toPlain());
  });
});
