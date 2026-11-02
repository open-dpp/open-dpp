import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import express from "express";
import request from "supertest";
import { correlationIdMiddleware } from "./correlation-id.middleware";
import { createLoggerMiddleware, isFrontendAssetPath } from "./logger.middleware";

describe("isFrontendAssetPath", () => {
  it.each([
    "/assets/index-BdF3x.js",
    "/assets/logo",
    "/favicon.ico",
    "/@vite/client",
    "/@fs/home/app/node_modules/vue.js",
    "/src/App.vue",
    "/node_modules/.vite/deps/vue.js",
  ])("treats %p as an asset", (path) => {
    expect(isFrontendAssetPath(path)).toBe(true);
  });

  it.each([
    "/",
    "/index.html",
    "/organizations/123/passports",
    "/api/v1/media/file.png",
    "/api",
    "/gs1/v1/01/09506000134352/10/AB.12",
  ])("does not treat %p as an asset", (path) => {
    expect(isFrontendAssetPath(path)).toBe(false);
  });
});

describe("createLoggerMiddleware", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function spyOnLogger() {
    const calls: { level: string; message: unknown }[] = [];
    for (const level of ["verbose", "debug", "warn", "error"] as const) {
      jest.spyOn(Logger.prototype, level).mockImplementation((message: unknown) => {
        calls.push({ level, message });
      });
    }
    return calls;
  }

  function createApp(logFormat: "json" | "plain") {
    const app = express();
    app.set("trust proxy", true);
    app.use(correlationIdMiddleware);
    app.use(createLoggerMiddleware(logFormat));
    app.get("/assets/app.js", (_req, res) => {
      res.send("js");
    });
    app.get("/assets/missing.js", (_req, res) => {
      res.status(404).send();
    });
    app.get("/passports", (_req, res) => {
      res.send("<html></html>");
    });
    return app;
  }

  it("logs successful asset requests as verbose and page requests as debug", async () => {
    const calls = spyOnLogger();
    const app = createApp("plain");

    await request(app).get("/assets/app.js").expect(200);
    await request(app).get("/passports").expect(200);

    expect(calls.map(({ level }) => level)).toEqual(["verbose", "debug"]);
  });

  it("still warns about failing asset requests", async () => {
    const calls = spyOnLogger();

    await request(createApp("plain")).get("/assets/missing.js").expect(404);

    expect(calls.map(({ level }) => level)).toEqual(["warn"]);
  });

  it.each(["json", "plain"] as const)(
    "keeps query values such as reset tokens out of %s logs",
    async (logFormat) => {
      const calls = spyOnLogger();

      await request(createApp(logFormat)).get("/passports?token=secret-token").expect(200);

      const logged = JSON.stringify(calls[0].message);
      expect(logged).toContain("/passports");
      expect(logged).not.toContain("secret-token");
    },
  );

  it("logs the correlation id and the forwarded client ip", async () => {
    const calls = spyOnLogger();

    await request(createApp("json"))
      .get("/passports")
      .set("x-correlation-id", "corr-1")
      .set("x-forwarded-for", "203.0.113.7")
      .expect(200);

    expect(calls[0].message).toEqual(
      expect.objectContaining({ correlationId: "corr-1", ip: "203.0.113.7", status: 200 }),
    );
  });
});
