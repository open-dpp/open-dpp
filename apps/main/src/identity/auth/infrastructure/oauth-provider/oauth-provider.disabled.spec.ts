import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import type { Connection } from "mongoose";
import request from "supertest";
import {
  AUTH_PATH,
  bootAuthTestApp,
  collectionNames,
  OAUTH_PROVIDER_COLLECTIONS,
} from "./oauth-provider.test-app";

describe("OAuth Provider disabled (the default)", () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    ({ app, connection } = await bootAuthTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it("still serves the session endpoint on the auth mount", async () => {
    const response = await request(app.getHttpServer()).get(`${AUTH_PATH}/get-session`);

    expect(response.status).toBe(200);
  });

  it.each([
    ["get", "/.well-known/openid-configuration"],
    ["get", "/.well-known/oauth-authorization-server"],
    ["get", "/jwks"],
    ["get", "/oauth2/authorize?client_id=landing-page&response_type=code"],
    ["post", "/oauth2/token"],
    ["get", "/oauth2/userinfo"],
    ["post", "/oauth2/introspect"],
    ["post", "/oauth2/revoke"],
  ] as const)("does not serve %s %s", async (method, path) => {
    const response = await request(app.getHttpServer())[method](`${AUTH_PATH}${path}`);

    expect(response.status).toBe(404);
  });

  it("creates none of the OAuth Provider collections", async () => {
    const names = await collectionNames(connection);

    expect(names.filter((name) => OAUTH_PROVIDER_COLLECTIONS.includes(name))).toEqual([]);
  });
});
