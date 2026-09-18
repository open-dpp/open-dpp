import { Body, Controller, Patch } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import request from "supertest";
import { applyBodySizeHandler } from "./body-handler";

@Controller()
class EchoController {
  @Patch("echo/$value")
  echoValue(@Body() body: unknown) {
    return { received: body };
  }

  @Patch("echo")
  echo(@Body() body: unknown) {
    return { received: body };
  }
}

describe("applyBodySizeHandler", () => {
  async function createApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [EnvModule.forRoot()],
      controllers: [EchoController],
    }).compile();

    const app = moduleRef.createNestApplication();
    applyBodySizeHandler(app);
    await app.init();
    return app;
  }

  describe("on a $value endpoint", () => {
    it("accepts a bare JSON scalar (string) as the top-level request body", async () => {
      const app = await createApp();
      const response = await request(app.getHttpServer())
        .patch("/echo/$value")
        .set("Content-Type", "application/json")
        .send('"newValue"');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ received: "newValue" });
      await app.close();
    });

    it("accepts a bare JSON number and boolean as the top-level request body", async () => {
      const app = await createApp();

      const numberResponse = await request(app.getHttpServer())
        .patch("/echo/$value")
        .set("Content-Type", "application/json")
        .send("42");
      expect(numberResponse.status).toEqual(200);
      expect(numberResponse.body).toEqual({ received: 42 });

      const boolResponse = await request(app.getHttpServer())
        .patch("/echo/$value")
        .set("Content-Type", "application/json")
        .send("true");
      expect(boolResponse.status).toEqual(200);
      expect(boolResponse.body).toEqual({ received: true });
      await app.close();
    });

    it("still accepts a JSON object body", async () => {
      const app = await createApp();
      const response = await request(app.getHttpServer())
        .patch("/echo/$value")
        .set("Content-Type", "application/json")
        .send({ foo: "bar" });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ received: { foo: "bar" } });
      await app.close();
    });

    it("still rejects genuinely malformed JSON with 'Invalid JSON payload'", async () => {
      const app = await createApp();
      const response = await request(app.getHttpServer())
        .patch("/echo/$value")
        .set("Content-Type", "application/json")
        .send("not valid json at all {");

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("Invalid JSON payload");
      await app.close();
    });
  });

  describe("on a non-$value endpoint", () => {
    it("still rejects a bare JSON scalar as the top-level request body (strict mode intact)", async () => {
      const app = await createApp();
      const response = await request(app.getHttpServer())
        .patch("/echo")
        .set("Content-Type", "application/json")
        .send('"newValue"');

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual("Invalid JSON payload");
      await app.close();
    });

    it("still accepts a JSON object body", async () => {
      const app = await createApp();
      const response = await request(app.getHttpServer())
        .patch("/echo")
        .set("Content-Type", "application/json")
        .send({ foo: "bar" });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ received: { foo: "bar" } });
      await app.close();
    });
  });
});
