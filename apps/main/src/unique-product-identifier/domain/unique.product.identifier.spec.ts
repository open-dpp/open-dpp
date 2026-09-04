import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import {
  UniqueProductIdentifierListItemDtoSchema,
  UniqueProductIdentifierType,
} from "@open-dpp/dto";
import { UniqueProductIdentifier } from "./unique.product.identifier";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";

describe("UniqueProductIdentifier (GS1)", () => {
  it("creates an OPEN_DPP_UUID UPI with no GS1 identity by default", () => {
    const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
    expect(upi.type).toBe(UniqueProductIdentifierType.OPEN_DPP_UUID);
    expect(upi.gs1).toBeUndefined();
  });

  it("creates a GS1 UPI from a raw GTIN, normalizing it to GTIN-14", () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    expect(upi.type).toBe(UniqueProductIdentifierType.GS1);
    expect(upi.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
    expect(upi.referenceId).toBe(referenceId);
  });

  it("rejects creating a GS1 UPI with an invalid GTIN check digit", () => {
    expect(() =>
      UniqueProductIdentifier.createGs1({ referenceId: randomUUID(), gtin: "4006381333930" }),
    ).toThrow(ValueError);
  });

  it("rejects creating a GS1 UPI with a wrong-length GTIN", () => {
    expect(() =>
      UniqueProductIdentifier.createGs1({ referenceId: randomUUID(), gtin: "123456789" }),
    ).toThrow(ValueError);
  });

  it("rejects loadFromDb of a GS1 row that has no gtin", () => {
    expect(() =>
      UniqueProductIdentifier.loadFromDb({
        uuid: randomUUID(),
        referenceId: randomUUID(),
        type: UniqueProductIdentifierType.GS1,
        gtin: null,
      }),
    ).toThrow(ValueError);
  });

  it("rejects a non-GS1 UPI that carries a gtin (invariant)", () => {
    expect(() =>
      UniqueProductIdentifier.loadFromDb({
        uuid: randomUUID(),
        referenceId: randomUUID(),
        type: UniqueProductIdentifierType.OPEN_DPP_UUID,
        gtin: VALID_GTIN13_AS_14,
      }),
    ).toThrow(ValueError);
  });

  it("loadFromDb reconstructs a GS1 identity and validates the stored GTIN-14", () => {
    const upi = UniqueProductIdentifier.loadFromDb({
      uuid: randomUUID(),
      referenceId: randomUUID(),
      type: UniqueProductIdentifierType.GS1,
      gtin: VALID_GTIN13_AS_14,
    });
    expect(upi.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
  });

  it("toPlain serializes the GS1 identity (gtin) alongside the discriminator", () => {
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: randomUUID(),
      gtin: VALID_GTIN13,
    });
    expect(upi.toPlain()).toEqual({
      uuid: upi.uuid,
      referenceId: upi.referenceId,
      type: UniqueProductIdentifierType.GS1,
      gtin: VALID_GTIN13_AS_14,
      batch: null,
      serial: null,
      organizationId: null,
    });
  });

  it("toPlain emits a null gtin for a non-GS1 UPI", () => {
    const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
    expect(upi.toPlain()).toEqual({
      uuid: upi.uuid,
      referenceId: upi.referenceId,
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
      gtin: null,
      batch: null,
      serial: null,
      organizationId: null,
    });
  });

  it("builds an uncompressed GS1 Digital Link from a resolver base", () => {
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: randomUUID(),
      gtin: VALID_GTIN13,
    });
    expect(upi.buildDigitalLink("https://id.example.com/p")).toBe(
      `https://id.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
    );
  });

  it("throws when building a Digital Link for a UPI without a GS1 identity", () => {
    const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
    expect(() => upi.buildDigitalLink("https://id.example.com")).toThrow(ValueError);
  });

  describe("toGs1Response", () => {
    const RESOLVER_BASE = "https://id.example.com/p";
    const RESOLVER_ORIGIN = "https://id.example.com";

    it("assembles the response for a model-granularity GS1 UPI (gtin only)", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
      expect(upi.toGs1Response(RESOLVER_BASE)).toEqual({
        uuid: upi.uuid,
        referenceId,
        gtin: VALID_GTIN13_AS_14,
        batch: null,
        serial: null,
        digitalLink: `${RESOLVER_ORIGIN}/gs1/v1/01/${VALID_GTIN13_AS_14}`,
      });
    });

    it("assembles the response for a batch-granularity GS1 UPI", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.createGs1({
        referenceId,
        gtin: VALID_GTIN13,
        batch: "LOT-42",
      });
      expect(upi.toGs1Response(RESOLVER_BASE)).toEqual({
        uuid: upi.uuid,
        referenceId,
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: null,
        digitalLink: `${RESOLVER_ORIGIN}/gs1/v1/01/${VALID_GTIN13_AS_14}/10/LOT-42`,
      });
    });

    it("assembles the response for an item-granularity GS1 UPI (batch + serial)", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.createGs1({
        referenceId,
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(upi.toGs1Response(RESOLVER_BASE)).toEqual({
        uuid: upi.uuid,
        referenceId,
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
        digitalLink: `${RESOLVER_ORIGIN}/gs1/v1/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
      });
    });

    it("throws for a UPI without a GS1 identity", () => {
      const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
      expect(() => upi.toGs1Response(RESOLVER_BASE)).toThrow(ValueError);
    });
  });

  describe("batch & serial (Phase 2)", () => {
    it("creates a GS1 UPI with an optional batch and serial, trimming them", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.createGs1({
        referenceId,
        gtin: VALID_GTIN13,
        batch: "  LOT-42 ",
        serial: " SN-001 ",
      });
      expect(upi.gs1).toEqual({
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
      });
    });

    it("treats a blank batch / serial as absent", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "   ",
        serial: "",
      });
      expect(upi.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
      expect(upi.gs1?.batch).toBeUndefined();
      expect(upi.gs1?.serial).toBeUndefined();
    });

    it("rejects a batch with a character outside CSET-82", () => {
      expect(() =>
        UniqueProductIdentifier.createGs1({
          referenceId: randomUUID(),
          gtin: VALID_GTIN13,
          batch: "bad value",
        }),
      ).toThrow(ValueError);
    });

    it("rejects an over-length serial", () => {
      expect(() =>
        UniqueProductIdentifier.createGs1({
          referenceId: randomUUID(),
          gtin: VALID_GTIN13,
          serial: "x".repeat(21),
        }),
      ).toThrow(ValueError);
    });

    it("withGs1 returns a NEW instance carrying the full key (immutability)", () => {
      const referenceId = randomUUID();
      const base = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
      const updated = base.withGs1({ gtin: VALID_GTIN13, batch: "LOT-42", serial: "SN-001" });
      expect(updated).not.toBe(base);
      expect(updated.uuid).toBe(base.uuid);
      expect(updated.gs1).toEqual({
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(base.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
    });

    it("withGs1 preserves organizationId (an edited GS1 UPI must not vanish from the org list)", () => {
      const organizationId = randomUUID();
      const base = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        organizationId,
      });
      const updated = base.withGs1({ gtin: VALID_GTIN13, batch: "LOT-42" });
      expect(updated.organizationId).toBe(organizationId);
    });

    it("withGs1 can clear a previously-set batch / serial", () => {
      const referenceId = randomUUID();
      const base = UniqueProductIdentifier.createGs1({
        referenceId,
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      const cleared = base.withGs1({ gtin: VALID_GTIN13 });
      expect(cleared.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
    });

    it("loadFromDb reconstructs a stored batch and serial", () => {
      const upi = UniqueProductIdentifier.loadFromDb({
        uuid: randomUUID(),
        referenceId: randomUUID(),
        type: UniqueProductIdentifierType.GS1,
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(upi.gs1).toEqual({
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
      });
    });

    it("loadFromDb treats null batch / serial as absent", () => {
      const upi = UniqueProductIdentifier.loadFromDb({
        uuid: randomUUID(),
        referenceId: randomUUID(),
        type: UniqueProductIdentifierType.GS1,
        gtin: VALID_GTIN13_AS_14,
        batch: null,
        serial: null,
      });
      expect(upi.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
    });

    it("toPlain serializes batch and serial (null when absent)", () => {
      const withKeys = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(withKeys.toPlain()).toEqual({
        uuid: withKeys.uuid,
        referenceId: withKeys.referenceId,
        type: UniqueProductIdentifierType.GS1,
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
        organizationId: null,
      });

      const bare = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
      });
      expect(bare.toPlain()).toEqual({
        uuid: bare.uuid,
        referenceId: bare.referenceId,
        type: UniqueProductIdentifierType.GS1,
        gtin: VALID_GTIN13_AS_14,
        batch: null,
        serial: null,
        organizationId: null,
      });
    });

    it("builds a Digital Link listing AIs in canonical order 01 -> 10 -> 21", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(upi.buildDigitalLink("https://id.example.com")).toBe(
        `https://id.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
      );
    });
  });

  describe("granularity", () => {
    it("returns 'model' for a GS1 UPI with only a GTIN", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
      });
      expect(upi.granularity).toBe("model");
    });

    it("returns 'batch' for a GS1 UPI with GTIN + batch (no serial)", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "LOT-42",
      });
      expect(upi.granularity).toBe("batch");
    });

    it("returns 'item' for a GS1 UPI with GTIN + serial (serial dominates regardless of batch)", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(upi.granularity).toBe("item");
    });

    it("returns null for a non-GS1 UPI (OPEN_DPP_UUID)", () => {
      const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
      expect(upi.granularity).toBeNull();
    });
  });

  describe("canonicalValue", () => {
    it("is the Digital-Link path with normalized GTIN-14 and encoded components", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "LOT/1",
        serial: "SN-1",
      });
      expect(upi.canonicalValue).toBe(`01/${VALID_GTIN13_AS_14}/10/LOT%2F1/21/SN-1`);
    });

    it("is the uuid for a non-GS1 UPI", () => {
      const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
      expect(upi.canonicalValue).toBe(upi.uuid);
    });
  });

  describe("toListItem", () => {
    const RESOLVER_BASE = "https://id.example.com/p";
    const RESOLVER_ORIGIN = "https://id.example.com";

    it("returns a full list item for a GS1 UPI with gtin+batch+serial", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.createGs1({
        referenceId,
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      const item = upi.toListItem({ resolverBase: RESOLVER_BASE, passportPublished: false });
      expect(item).toEqual({
        uuid: upi.uuid,
        referenceId,
        type: UniqueProductIdentifierType.GS1,
        gtin: VALID_GTIN13_AS_14,
        batch: "LOT-42",
        serial: "SN-001",
        granularity: "item",
        digitalLink: `${RESOLVER_ORIGIN}/gs1/v1/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
        passportPublished: false,
        permalink: null,
      });
    });

    it("passes a permalink summary through verbatim and defaults it to null", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
      });
      const summary = { id: randomUUID(), publicUrl: "https://dpp.example.com/my-link" };
      expect(upi.toListItem({ passportPublished: false, permalink: summary }).permalink).toEqual(
        summary,
      );
      expect(upi.toListItem({ passportPublished: false }).permalink).toBeNull();
    });

    it("returns granularity 'model' and a bare-GTIN digital link for a bare-GTIN GS1 UPI", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
      const item = upi.toListItem({ resolverBase: RESOLVER_BASE, passportPublished: true });
      expect(item.granularity).toBe("model");
      expect(item.digitalLink).toBe(`${RESOLVER_ORIGIN}/gs1/v1/01/${VALID_GTIN13_AS_14}`);
      expect(item.passportPublished).toBe(true);
    });

    it("returns null gtin/batch/serial/granularity/digitalLink for a non-GS1 UPI", () => {
      const referenceId = randomUUID();
      const upi = UniqueProductIdentifier.create({ referenceId });
      const item = upi.toListItem({ resolverBase: RESOLVER_BASE, passportPublished: false });
      expect(item.gtin).toBeNull();
      expect(item.batch).toBeNull();
      expect(item.serial).toBeNull();
      expect(item.granularity).toBeNull();
      expect(item.digitalLink).toBeNull();
    });

    it("passes passportPublished through verbatim", () => {
      const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
      expect(upi.toListItem({ passportPublished: true }).passportPublished).toBe(true);
      expect(upi.toListItem({ passportPublished: false }).passportPublished).toBe(false);
    });

    it("returns null digitalLink when resolverBase is not provided (GS1 UPI)", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
      });
      const item = upi.toListItem({ passportPublished: false });
      expect(item.digitalLink).toBeNull();
    });

    it("output validates against UniqueProductIdentifierListItemDtoSchema for a GS1 UPI", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      const item = upi.toListItem({ resolverBase: RESOLVER_BASE, passportPublished: false });
      expect(() => UniqueProductIdentifierListItemDtoSchema.parse(item)).not.toThrow();
    });

    it("output validates against UniqueProductIdentifierListItemDtoSchema for a non-GS1 (system) UPI", () => {
      const upi = UniqueProductIdentifier.create({ referenceId: randomUUID() });
      const item = upi.toListItem({ passportPublished: false });
      expect(() => UniqueProductIdentifierListItemDtoSchema.parse(item)).not.toThrow();
    });

    it("output validates against UniqueProductIdentifierListItemDtoSchema for a bare-GTIN GS1 UPI", () => {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
      });
      const item = upi.toListItem({ resolverBase: RESOLVER_BASE, passportPublished: true });
      expect(() => UniqueProductIdentifierListItemDtoSchema.parse(item)).not.toThrow();
    });
  });
});
