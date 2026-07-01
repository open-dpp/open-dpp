import { describe, expect, it, jest } from "@jest/globals";
import { setSafeMediaHeaders, streamMedia, toPublicMediaInfo } from "./media-response.util";

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    headersSent: false,
    setHeader: jest.fn((k: string, v: string) => {
      headers[k] = v;
    }),
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    destroy: jest.fn(),
  };
  return { res, headers };
}

function makeStream() {
  let errorHandler: ((e: Error) => void) | undefined;
  const stream = {
    pipe: jest.fn(),
    on: jest.fn((event: string, cb: (e: Error) => void) => {
      if (event === "error") {
        errorHandler = cb;
      }
    }),
  };
  return { stream, fireError: (e: Error) => errorHandler?.(e) };
}

describe("setSafeMediaHeaders", () => {
  it("always sets X-Content-Type-Options: nosniff", () => {
    const { res, headers } = makeRes();
    setSafeMediaHeaders(res as never, { mimeType: "application/pdf" } as never);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("echoes an allowlisted content-type and does not force an attachment", () => {
    const { res, headers } = makeRes();
    setSafeMediaHeaders(res as never, { mimeType: "image/webp" } as never);
    expect(headers["Content-Type"]).toBe("image/webp");
    expect(headers["Content-Disposition"]).toBeUndefined();
  });

  it("clamps a non-allowlisted content-type to octet-stream + attachment (XSS guard)", () => {
    const { res, headers } = makeRes();
    setSafeMediaHeaders(res as never, { mimeType: "text/html" } as never);
    expect(headers["Content-Type"]).toBe("application/octet-stream");
    expect(headers["Content-Disposition"]).toBe("attachment");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});

describe("toPublicMediaInfo", () => {
  it("keeps only the public fields and drops internal storage/ownership details", () => {
    const media = {
      id: "m-1",
      title: "doc.pdf",
      mimeType: "application/pdf",
      size: 42,
      bucket: "secret-bucket",
      objectName: "product-passport-files/abc",
      eTag: "etag",
      versionId: "v1",
      ownedByOrganizationId: "org-1",
      createdByUserId: "user-1",
    };
    expect(toPublicMediaInfo(media as never)).toEqual({
      id: "m-1",
      title: "doc.pdf",
      mimeType: "application/pdf",
      size: 42,
    });
  });
});

describe("streamMedia", () => {
  it("sets safe headers and pipes the stream to the response", () => {
    const { res, headers } = makeRes();
    const { stream } = makeStream();
    streamMedia(res as never, { mimeType: "application/pdf" } as never, stream as never);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(stream.pipe).toHaveBeenCalledWith(res);
  });

  it("destroys the response on a mid-stream error after headers are sent (no socket leak)", () => {
    const { res } = makeRes();
    res.headersSent = true;
    const { stream, fireError } = makeStream();
    streamMedia(res as never, { mimeType: "application/pdf" } as never, stream as never);
    fireError(new Error("S3 down"));
    expect(res.destroy).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("sends a 500 when the stream errors before headers are sent", () => {
    const { res } = makeRes();
    res.headersSent = false;
    const { stream, fireError } = makeStream();
    streamMedia(res as never, { mimeType: "application/pdf" } as never, stream as never);
    fireError(new Error("early"));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.destroy).not.toHaveBeenCalled();
  });
});
