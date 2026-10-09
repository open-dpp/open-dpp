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

  it("uses the oldest permalink", () => {
    const oldest = openDpp(new Date("2026-01-01"), "https://a.example/1");
    const newer = openDpp(new Date("2026-02-01"), "https://a.example/2");
    expect(RegistryExportItem.fromPermalinks([newer, oldest])?.uniqueProductIdentifier).toBe(
      "https://a.example/1",
    );
  });

  it("does not prefer a kind of permalink, only the age counts", () => {
    const openDppOlder = RegistryExportItem.fromPermalinks([
      gs1(new Date("2026-03-01"), "https://gs1.example/x"),
      openDpp(new Date("2026-01-01"), "https://a.example/old"),
    ]);
    expect(openDppOlder?.uniqueProductIdentifier).toBe("https://a.example/old");

    const gs1Older = RegistryExportItem.fromPermalinks([
      openDpp(new Date("2026-03-01"), "https://a.example/new"),
      gs1(new Date("2026-01-01"), "https://gs1.example/old"),
    ]);
    expect(gs1Older?.uniqueProductIdentifier).toBe("https://gs1.example/old");
  });

  it("chooses the same permalink when a newer permalink is added later", () => {
    const first = openDpp(new Date("2026-01-01"), "https://a.example/first");
    const before = RegistryExportItem.fromPermalinks([first]);
    const after = RegistryExportItem.fromPermalinks([
      gs1(new Date("2026-06-01"), "https://gs1.example/later"),
      first,
    ]);
    expect(after).toEqual(before);
  });

  it("returns undefined when the oldest permalink is not published, without falling back", () => {
    expect(
      RegistryExportItem.fromPermalinks([
        openDpp(new Date("2026-01-01"), null),
        openDpp(new Date("2026-02-01"), "https://a.example/newer"),
      ]),
    ).toBeUndefined();
  });

  it("serializes to the registry item shape", () => {
    expect(RegistryExportItem.create({ uniqueProductIdentifier: "u" }).toPlain()).toEqual({
      uniqueProductIdentifier: "u",
    });
  });
});
