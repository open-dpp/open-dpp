// Must stay the first import: it links the legal documents before the auth module validates env.
import "../../../../test/legal-links.test-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { AUTH_BASE_PATH } from "../auth-base-path";
import { createAuthTestContext } from "../infrastructure/oauth-provider/auth.test.context";

function signUpBody(extra: Record<string, unknown> = {}) {
  return {
    email: `${randomUUID()}@test.test`,
    password: "password-1234",
    firstName: "Jane",
    lastName: "Doe",
    name: "Jane Doe",
    ...extra,
  };
}

describe("Sign-up consent while terms and privacy policy are linked", () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const testApp = await createAuthTestContext({ imports: [EventEmitterModule.forRoot()] });
    app = testApp.app;
    connection = testApp.connection;
  });

  afterAll(async () => {
    await app.close();
  });

  async function findRawUser(email: string) {
    const db = connection.db;
    if (!db) throw new Error("MongoDB connection not established");
    return db.collection("user").findOne({ email });
  }

  function signUp(body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post(`${AUTH_BASE_PATH}/sign-up/email`)
      .set("Accept", "application/json")
      .send(body);
  }

  it.each([
    ["without the consent flag", {}],
    ["with a declined consent flag", { termsAccepted: false }],
  ])("rejects a sign-up %s and creates no user", async (_, extra) => {
    const body = signUpBody(extra);

    const response = await signUp(body);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("TERMS_NOT_ACCEPTED");
    expect(await findRawUser(body.email)).toBeNull();
  });

  it("records when the visitor accepted, without persisting the consent flag", async () => {
    const body = signUpBody({ termsAccepted: true });
    const before = new Date();

    const response = await signUp(body);

    expect(response.status).toBe(200);
    const rawUser = await findRawUser(body.email);
    expect(rawUser?.termsAcceptedAt).toBeInstanceOf(Date);
    expect(rawUser?.termsAcceptedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(rawUser).not.toHaveProperty("termsAccepted");
  });

  it("does not let the client choose the acceptance time", async () => {
    const body = signUpBody({ termsAccepted: true, termsAcceptedAt: "2000-01-01T00:00:00.000Z" });

    const response = await signUp(body);

    expect(response.status).toBe(400);
    expect(await findRawUser(body.email)).toBeNull();
  });
});
