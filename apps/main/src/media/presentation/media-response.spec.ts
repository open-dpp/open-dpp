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

function appServing(stream: Readable, served: Media = media): express.Express {
  const app = express();
  app.get("/file", (_req, res) => sendMediaFile(res, { media: served, stream }));
  return app;
}

describe("sendMediaFile", () => {
  it("lets a cached copy be used only after the server confirmed it is current", async () => {
    const response = await request(appServing(Readable.from([Buffer.from("content")]))).get(
      "/file",
    );

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-cache");
    expect(response.headers.etag).toBe('"etag"');
  });

  it("answers 304 without content when the cached copy is the stored file", async () => {
    const stream = Readable.from([Buffer.from("content")]);
    const response = await request(appServing(stream)).get("/file").set("If-None-Match", '"etag"');

    expect(response.status).toBe(304);
    expect(response.body).toHaveLength(0);
    expect(stream.destroyed).toBe(true);
  });

  it("sends the file again once it was replaced under the same media", async () => {
    const replaced = media.withReplacedFile(
      {
        title: "manual-v2.pdf",
        description: "manual-v2.pdf",
        mimeType: "application/pdf",
        fileExtension: "pdf",
        size: 7,
        originalFilename: "manual-v2.pdf",
        bucket: "bucket",
        objectName: "product-passport-files/upi/field-2",
        eTag: "etag-2",
        versionId: "v2",
      },
      "replacer",
    );

    const response = await request(appServing(Readable.from([Buffer.from("content")]), replaced))
      .get("/file")
      .set("If-None-Match", '"etag"')
      .responseType("blob");

    expect(response.status).toBe(200);
    expect(response.headers.etag).toBe('"etag-2"');
    expect(response.body.toString("utf8")).toBe("content");
  });

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
