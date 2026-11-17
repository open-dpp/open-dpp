import { Readable } from "node:stream";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Media } from "../domain/media";
import { sendMediaFile } from "./media-response";

const media = Media.create({
  title: "manual.pdf",
  description: "manual.pdf",
  mimeType: "application/pdf",
  fileExtension: "pdf",
  size: 100,
  originalFilename: "manual.pdf",
  bucket: "bucket",
  objectName: "product-passport-files/upi/field",
  eTag: "etag",
  versionId: "v1",
  ownedByOrganizationId: "organization",
  createdByUserId: "creator",
  uniqueProductIdentifier: "upi",
  dataFieldId: "field",
});

/** A file stream that fails, optionally after it has sent its first chunk. */
function failingStream({ afterFirstChunk }: { afterFirstChunk: boolean }): Readable {
  let chunkSent = !afterFirstChunk;
  return new Readable({
    read() {
      if (!chunkSent) {
        chunkSent = true;
        this.push(Buffer.from("partial content"));
        return;
      }
      setImmediate(() => this.destroy(new Error("storage failed")));
    },
  });
}

function appServing(stream: Readable): express.Express {
  const app = express();
  app.get("/file", (_req, res) => sendMediaFile(res, { media, stream }));
  return app;
}

describe("sendMediaFile", () => {
  it("answers 500 when the file stream fails before anything was sent", async () => {
    const response = await request(appServing(failingStream({ afterFirstChunk: false })))
      .get("/file")
      .responseType("blob");

    expect(response.status).toBe(500);
    expect(JSON.parse(response.body.toString("utf8"))).toEqual({
      error: "Failed to retrieve file",
    });
  });

  it("closes the connection when the file stream fails after the headers were sent", async () => {
    await expect(
      request(appServing(failingStream({ afterFirstChunk: true }))).get("/file"),
    ).rejects.toThrow();
  }, 5_000);
});
