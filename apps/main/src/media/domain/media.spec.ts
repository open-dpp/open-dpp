import type { MediaFileProps } from "./media";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Media } from "./media";

const CREATED_AT = new Date("2026-01-10T08:00:00.000Z");
const REPLACED_AT = new Date("2026-03-05T12:30:00.000Z");

const manual: MediaFileProps = {
  title: "manual.pdf",
  description: "manual.pdf",
  mimeType: "application/pdf",
  fileExtension: "pdf",
  size: 100,
  originalFilename: "manual.pdf",
  bucket: "bucket",
  objectName: "product-passport-files/upi/field",
  eTag: "etag-1",
  versionId: "v1",
};

const photo: MediaFileProps = {
  title: "photo.png",
  description: "photo.png",
  mimeType: "image/webp",
  fileExtension: "webp",
  size: 2500,
  originalFilename: "photo.png",
  bucket: "bucket",
  objectName: "product-passport-files/upi/field",
  eTag: "etag-2",
  versionId: "v2",
};

function createManual(): Media {
  return Media.create({
    ...manual,
    ownedByOrganizationId: "organization",
    createdByUserId: "creator",
    uniqueProductIdentifier: "upi",
    dataFieldId: "field",
  });
}

describe("Media", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(CREATED_AT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has not been updated by anyone when it is created", () => {
    expect(createManual().updatedByUserId).toBeNull();
  });

  it("loads a media that was stored before updates were recorded", () => {
    const { updatedByUserId: _, ...storedBefore } = createManual();

    expect(Media.loadFromDb(storedBefore).updatedByUserId).toBeNull();
  });

  describe("withReplacedFile", () => {
    it("describes the new file and records who replaced it and when", () => {
      const original = createManual();
      vi.setSystemTime(REPLACED_AT);

      const replaced = original.withReplacedFile(photo, "replacer");

      expect(replaced).toMatchObject({ ...photo, updatedByUserId: "replacer" });
      expect(replaced.updatedAt).toEqual(REPLACED_AT);
    });

    it("stays the same media of the same creator, organization and passport field", () => {
      const original = createManual();
      vi.setSystemTime(REPLACED_AT);

      const replaced = original.withReplacedFile(photo, "replacer");

      expect(replaced).toMatchObject({
        id: original.id,
        createdByUserId: "creator",
        ownedByOrganizationId: "organization",
        uniqueProductIdentifier: "upi",
        dataFieldId: "field",
        createdAt: CREATED_AT,
      });
    });

    it("leaves the media it was called on unchanged", () => {
      const original = createManual();
      const before = { ...original };

      original.withReplacedFile(photo, "replacer");

      expect({ ...original }).toEqual(before);
    });
  });
});
