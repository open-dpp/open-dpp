import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { PermalinkKind } from "@open-dpp/dto";
import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
import { Permalink } from "../../permalink/domain/permalink";
import { RegistryExportItem } from "./registry-export-item";

function openDpp(createdAt: Date, url: string | null = `https://open-dpp.example/${randomUUID()}`) {
  const permalink = Permalink.create({ passportId: randomUUID(), createdAt });
  return url ? permalink.withPublishedUrl(url) : permalink;
}

function gs1(createdAt: Date, url: string | null = `https://gs1.example/${randomUUID()}`) {
  const permalink = Permalink.create({
    passportId: randomUUID(),
    kind: PermalinkKind.GS1_LINK,
    uniqueProductIdentifierId: randomUUID(),
    gs1DataAttributes: gs1DataAttributesPlainFactory.build(),
    createdAt,
  });
  return url ? permalink.withPublishedUrl(url) : permalink;
}

describe("registryExportItem.fromPermalinks", () => {
  it("returns undefined without permalinks", () => {
    expect(RegistryExportItem.fromPermalinks([])).toBeUndefined();
  });

  it("uses the oldest open-dpp permalink", () => {
    const oldest = openDpp(new Date("2026-01-01"), "https://a.example/1");
    const newer = openDpp(new Date("2026-02-01"), "https://a.example/2");
    expect(RegistryExportItem.fromPermalinks([newer, oldest])?.uniqueProductIdentifier).toBe(
      "https://a.example/1",
    );
  });

  it("prefers a GS1 permalink even if an open-dpp permalink is older", () => {
    const item = RegistryExportItem.fromPermalinks([
      openDpp(new Date("2026-01-01")),
      gs1(new Date("2026-03-01"), "https://gs1.example/x"),
    ]);
    expect(item?.uniqueProductIdentifier).toBe("https://gs1.example/x");
  });

  it("uses the oldest GS1 permalink", () => {
    const item = RegistryExportItem.fromPermalinks([
      gs1(new Date("2026-02-01"), "https://gs1.example/new"),
      gs1(new Date("2026-01-01"), "https://gs1.example/old"),
    ]);
    expect(item?.uniqueProductIdentifier).toBe("https://gs1.example/old");
  });

  it("returns undefined when the selected permalink is not published", () => {
    expect(RegistryExportItem.fromPermalinks([openDpp(new Date(), null)])).toBeUndefined();
  });

  it("serializes to the registry item shape", () => {
    expect(RegistryExportItem.create({ uniqueProductIdentifier: "u" }).toPlain()).toEqual({
      uniqueProductIdentifier: "u",
    });
  });
});
