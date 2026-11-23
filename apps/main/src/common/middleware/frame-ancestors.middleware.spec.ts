import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { createFrameAncestorsMiddleware } from "./frame-ancestors.middleware";

describe("createFrameAncestorsMiddleware", () => {
  function createApp(embedOrigins: string[]) {
    const app = express();
    app.use(createFrameAncestorsMiddleware(embedOrigins));
    app.get("/", (_req, res) => {
      res.send("ok");
    });
    return app;
  }

  it("allows framing by open-dpp itself and the embed origins only", async () => {
    const response = await request(
      createApp(["http://127.0.0.1:5173", "https://partner.example.com"]),
    )
      .get("/")
      .expect(200);

    expect(response.headers["content-security-policy"]).toBe(
      "frame-ancestors 'self' http://127.0.0.1:5173 https://partner.example.com",
    );
  });

  it("sends no policy without embed origins", async () => {
    const response = await request(createApp([])).get("/").expect(200);

    expect(response.headers["content-security-policy"]).toBeUndefined();
  });
});
