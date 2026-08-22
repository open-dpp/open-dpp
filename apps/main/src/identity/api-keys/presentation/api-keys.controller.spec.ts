import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import type { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { OrganizationsModule } from "../../organizations/organizations.module";
import { UsersService } from "../../users/application/services/users.service";
import { UsersModule } from "../../users/users.module";
import { ApiKeysModule } from "../api-keys.module";

describe("ApiKeysController", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        AuthModule,
        UsersModule,
        OrganizationsModule,
        ApiKeysModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ send: jest.fn() })
      .compile();

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(
      new NotFoundInDatabaseExceptionFilter(),
      new NotFoundExceptionFilter(),
      new ValueErrorFilter(),
      new ForbiddenExceptionFilter(),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function signedInUser() {
    const { user } = await betterAuthHelper.createUser();
    const cookie = await betterAuthHelper.signAsUser(user.id);
    return { user, cookie };
  }

  function createKey(cookie: string, body: Record<string, unknown>) {
    return request(app.getHttpServer()).post("/users/me/api-keys").set("Cookie", cookie).send(body);
  }

  describe("POST /users/me/api-keys", () => {
    it("rejects requests without a session", async () => {
      const response = await request(app.getHttpServer())
        .post("/users/me/api-keys")
        .send({ name: "My key" });
      // AuthGuard responds with 403 for missing sessions (see users.controller.spec)
      expect(response.status).toBe(403);
    });

    it("creates a key and returns the plain key exactly once", async () => {
      const { cookie } = await signedInUser();

      const response = await createKey(cookie, { name: "CI pipeline" });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("CI pipeline");
      expect(response.body.key).toMatch(/^opendpp_/);
      expect(response.body.start).toBe(response.body.key.slice(0, response.body.start.length));
      expect(response.body.expiresAt).toBeNull();
      expect(response.body.id).toEqual(expect.any(String));
    });

    it("applies the expiry preset in days", async () => {
      const { cookie } = await signedInUser();

      const response = await createKey(cookie, { name: "Short lived", expiresInDays: 30 });

      expect(response.status).toBe(201);
      const expiresAt = new Date(response.body.expiresAt).getTime();
      const expected = Date.now() + 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expiresAt - expected)).toBeLessThan(60_000);
    });

    it("rejects an empty name and unsupported expiry values", async () => {
      const { cookie } = await signedInUser();

      expect((await createKey(cookie, { name: "" })).status).toBe(400);
      expect((await createKey(cookie, {})).status).toBe(400);
      expect((await createKey(cookie, { name: "k", expiresInDays: 7 })).status).toBe(400);
    });
  });

  describe("GET /users/me/api-keys", () => {
    it("lists only the caller's keys, masked, newest first", async () => {
      const { cookie } = await signedInUser();
      const { cookie: otherCookie } = await signedInUser();
      await createKey(otherCookie, { name: "Other users key" });
      const first = await createKey(cookie, { name: "First" });
      const second = await createKey(cookie, { name: "Second" });

      const response = await request(app.getHttpServer())
        .get("/users/me/api-keys")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.result).toHaveLength(2);
      expect(response.body.result.map((k: any) => k.id)).toEqual([second.body.id, first.body.id]);
      for (const item of response.body.result) {
        expect(item.key).toBeUndefined();
        expect(item.start).toMatch(/^opendpp_/);
        expect(item.lastUsedAt).toBeNull();
      }
      expect(response.body.paging_metadata.cursor).toBeNull();
    });

    it("paginates with a cursor", async () => {
      const { cookie } = await signedInUser();
      for (const name of ["a", "b", "c"]) {
        await createKey(cookie, { name });
      }

      const firstPage = await request(app.getHttpServer())
        .get("/users/me/api-keys?limit=2")
        .set("Cookie", cookie);
      expect(firstPage.status).toBe(200);
      expect(firstPage.body.result).toHaveLength(2);
      expect(firstPage.body.paging_metadata.cursor).toEqual(expect.any(String));

      const secondPage = await request(app.getHttpServer())
        .get(`/users/me/api-keys?limit=2&cursor=${firstPage.body.paging_metadata.cursor}`)
        .set("Cookie", cookie);
      expect(secondPage.status).toBe(200);
      expect(secondPage.body.result).toHaveLength(1);
      expect(secondPage.body.paging_metadata.cursor).toBeNull();

      const ids = [...firstPage.body.result, ...secondPage.body.result].map((k: any) => k.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe("PATCH /users/me/api-keys/:id", () => {
    it("renames an own key", async () => {
      const { cookie } = await signedInUser();
      const created = await createKey(cookie, { name: "Old name" });

      const response = await request(app.getHttpServer())
        .patch(`/users/me/api-keys/${created.body.id}`)
        .set("Cookie", cookie)
        .send({ name: "New name" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("New name");
      expect(response.body.key).toBeUndefined();
    });

    it("returns 404 for another user's key", async () => {
      const { cookie } = await signedInUser();
      const { cookie: otherCookie } = await signedInUser();
      const created = await createKey(otherCookie, { name: "Not yours" });

      const response = await request(app.getHttpServer())
        .patch(`/users/me/api-keys/${created.body.id}`)
        .set("Cookie", cookie)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /users/me/api-keys/:id", () => {
    it("revokes an own key", async () => {
      const { cookie } = await signedInUser();
      const created = await createKey(cookie, { name: "To revoke" });

      const response = await request(app.getHttpServer())
        .delete(`/users/me/api-keys/${created.body.id}`)
        .set("Cookie", cookie);
      expect(response.status).toBe(204);

      const list = await request(app.getHttpServer())
        .get("/users/me/api-keys")
        .set("Cookie", cookie);
      expect(list.body.result).toHaveLength(0);
    });

    it("returns 404 for another user's key", async () => {
      const { cookie } = await signedInUser();
      const { cookie: otherCookie } = await signedInUser();
      const created = await createKey(otherCookie, { name: "Not yours" });

      const response = await request(app.getHttpServer())
        .delete(`/users/me/api-keys/${created.body.id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
    });
  });

  describe("created key against the API", () => {
    it("cannot manage keys itself: key management requires a browser session", async () => {
      const { cookie } = await signedInUser();
      const created = await createKey(cookie, { name: "No self-service" });

      const response = await request(app.getHttpServer())
        .post("/users/me/api-keys")
        .set("x-api-key", created.body.key)
        .send({ name: "Minted by a key" });

      expect(response.status).toBe(403);
    });

    it("authenticates via x-api-key and surfaces lastUsedAt", async () => {
      const { cookie } = await signedInUser();
      const created = await createKey(cookie, { name: "Round trip" });

      const meResponse = await request(app.getHttpServer())
        .get("/users/me/api-keys")
        .set("x-api-key", created.body.key);
      expect(meResponse.status).toBe(200);

      const list = await request(app.getHttpServer())
        .get("/users/me/api-keys")
        .set("Cookie", cookie);
      const roundTripKey = list.body.result.find((k: any) => k.id === created.body.id);
      expect(roundTripKey.lastUsedAt).toEqual(expect.any(String));
    });
  });
});
