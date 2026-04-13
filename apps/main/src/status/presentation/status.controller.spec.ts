import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { getApp } from "../../../test/utils.for.test";
import { StatusModule } from "../status.module";

describe("statusController", () => {
  let app: INestApplication;
  let module: TestingModule;
  const originalAppVersion = process.env.APP_VERSION;

  beforeAll(async () => {
    process.env.APP_VERSION = "1.2.3-test";

    module = await Test.createTestingModule({
      imports: [StatusModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
    if (originalAppVersion === undefined) {
      delete process.env.APP_VERSION;
    }
    else {
      process.env.APP_VERSION = originalAppVersion;
    }
  });

  it("gET /api/status should return 200 with the configured app version", async () => {
    const response = await request(getApp(app)).get("/api/status").expect(200);

    expect(response.body).toEqual({ version: "1.2.3-test" });
  });
});
