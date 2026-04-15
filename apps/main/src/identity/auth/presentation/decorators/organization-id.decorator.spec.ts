import { Controller, Get, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { getApp } from "../../../../../test/utils.for.test";
import { OrganizationId } from "./organization-id.decorator";

@Controller("test")
class TestController {
  @Get()
  get(@OrganizationId() organizationId: string) {
    return { organizationId };
  }
}

describe("organizationId decorator", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should extract organizationId from X-OPEN-DPP-ORGANIZATION-ID header", async () => {
    const orgId = "test-org-123";
    const response = await request(getApp(app))
      .get("/test")
      .set("X-OPEN-DPP-ORGANIZATION-ID", orgId);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ organizationId: orgId });
  });

  it("should throw BadRequestException when header is missing", async () => {
    const response = await request(getApp(app)).get("/test");

    expect(response.status).toEqual(400);
  });
});
