import { uniqueProductIdentifierPlainFactory } from "@open-dpp/testing";
import { UniqueProductIdentifier } from "./unique.product.identifier";

describe("UniqueProductIdentifier loadFromDb -> toPlain round-trip", () => {
  it("preserves an OPEN_DPP_UUID row and null-defaults gs1 fields + organizationId", () => {
    const plain = uniqueProductIdentifierPlainFactory.build();

    const result = UniqueProductIdentifier.loadFromDb(plain).toPlain();

    expect(result).toEqual({
      uuid: plain.uuid,
      referenceId: plain.referenceId,
      type: "OPEN_DPP_UUID",
      gtin: null,
      batch: null,
      serial: null,
      organizationId: null,
    });
  });

  it("preserves a GS1 row's gtin (absent batch/serial -> null)", () => {
    const plain = uniqueProductIdentifierPlainFactory.build({}, { transient: { gs1: true } });

    const result = UniqueProductIdentifier.loadFromDb(plain).toPlain();

    expect(result).toEqual({
      uuid: plain.uuid,
      referenceId: plain.referenceId,
      type: "GS1",
      gtin: plain.gtin,
      batch: null,
      serial: null,
      organizationId: null,
    });
  });

  it("preserves a GS1 row's batch and serial", () => {
    const plain = uniqueProductIdentifierPlainFactory.build(
      {},
      { transient: { gs1: true, batch: "LOT42", serial: "SN7" } },
    );

    const result = UniqueProductIdentifier.loadFromDb(plain).toPlain();

    expect(result.gtin).toBe(plain.gtin);
    expect(result.batch).toBe("LOT42");
    expect(result.serial).toBe("SN7");
  });

  it("preserves organizationId when present", () => {
    const plain = uniqueProductIdentifierPlainFactory.build();

    const result = UniqueProductIdentifier.loadFromDb({
      ...plain,
      organizationId: "org-9",
    }).toPlain();

    expect(result.organizationId).toBe("org-9");
  });
});
