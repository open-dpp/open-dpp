import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { getApp } from "../../../test/utils.for.test";
import packageJson from "../../../package.json";
import { StatusModule } from "../status.module";

describe("StatusController", () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
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
  });

  it("GET /api/status should return 200 with version from package.json", async () => {
    const response = await request(getApp(app)).get("/api/status").expect(200);

    expect(response.body).toEqual({ version: packageJson.version });
  });

  it("GET /api/status should be accessible without authentication", async () => {
    await request(getApp(app)).get("/api/status").expect(200);
  });
});
