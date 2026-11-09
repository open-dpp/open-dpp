import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import {
  CORRELATION_ID_HEADER,
  correlationIdMiddleware,
  MAX_CORRELATION_ID_LENGTH,
} from "./correlation-id.middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("correlationIdMiddleware", () => {
  function createApp() {
    const app = express();
    app.use(correlationIdMiddleware);
    app.get("/", (req, res) => {
      res.json({ correlationId: req.headers[CORRELATION_ID_HEADER] });
    });
    return app;
  }

  it.each(["corr-1", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", "a".repeat(128)])(
    "reuses and echoes the caller-supplied id %p",
    async (correlationId) => {
      const response = await request(createApp())
        .get("/")
        .set(CORRELATION_ID_HEADER, correlationId)
        .expect(200);

      expect(response.body.correlationId).toBe(correlationId);
      expect(response.headers[CORRELATION_ID_HEADER]).toBe(correlationId);
    },
  );

  it("mints a uuid when the caller sends none", async () => {
    const response = await request(createApp()).get("/").expect(200);

    expect(response.body.correlationId).toMatch(UUID_REGEX);
    expect(response.headers[CORRELATION_ID_HEADER]).toBe(response.body.correlationId);
  });

  it.each([
    ["too long", "a".repeat(MAX_CORRELATION_ID_LENGTH + 1)],
    ["markup", "<script>alert(1)</script>"],
    ["whitespace", "corr 1"],
    ["a JSON fragment", '","status":200'],
    ["empty", ""],
  ])("replaces a %s id with a fresh uuid", async (_label, correlationId) => {
    const response = await request(createApp())
      .get("/")
      .set(CORRELATION_ID_HEADER, correlationId)
      .expect(200);

    expect(response.body.correlationId).toMatch(UUID_REGEX);
    expect(response.headers[CORRELATION_ID_HEADER]).toBe(response.body.correlationId);
  });
});
