import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { PolicyKeyList } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import type { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../identity/users/users.module";
import { LimitRepository } from "../infrastructure/limit.repository";
import { PolicyService } from "../infrastructure/policy.service";
import { QuotaRepository } from "../infrastructure/quota.repository";
import { PolicyModule } from "../policy.module";

describe("PolicyController", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let policyService: PolicyService;
  let limitRepository: LimitRepository;
  let quotaRepository: QuotaRepository;
  const betterAuthHelper = new BetterAuthHelper();

  const limitsPath = (organizationId: string) => `/policies/organizations/${organizationId}/limits`;

  async function seedOrganization(): Promise<string> {
    const organizationId = randomUUID();
    await policyService.ensureDefaultPolicies(organizationId);
    return organizationId;
  }

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
        PolicyModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ send: () => undefined })
      .compile();

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));
    policyService = moduleRef.get<PolicyService>(PolicyService);
    limitRepository = moduleRef.get<LimitRepository>(LimitRepository);
    quotaRepository = moduleRef.get<QuotaRepository>(QuotaRepository);

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

  describe("PATCH /policies/organizations/:organizationId/limits", () => {
    it("rejects an anonymous caller", async () => {
      const organizationId = await seedOrganization();

      await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .send({ [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 })
        .expect(403);
    });

    it("returns 403 when the caller is not an instance admin", async () => {
      const organizationId = await seedOrganization();
      const { user } = await betterAuthHelper.createUser();
      const cookie = await betterAuthHelper.signAsUser(user.id);

      await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .set("Cookie", cookie)
        .send({ [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 })
        .expect(403);

      const unchanged = await limitRepository.findOneByOrganizationIdAndKeyOrFail(
        organizationId,
        PolicyKeyList.MEDIA_STORAGE_LIMIT,
      );
      expect(unchanged.getLimit()).not.toBe(500);
    });

    it("lets an instance admin set limits for an organization they are not a member of", async () => {
      const organizationId = await seedOrganization();
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const cookie = await betterAuthHelper.signAsUser(admin.id);

      const response = await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .set("Cookie", cookie)
        .send({
          [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500,
          [PolicyKeyList.AI_TOKEN_QUOTA]: 2000,
        })
        .expect(200);

      expect(response.body[PolicyKeyList.MEDIA_STORAGE_LIMIT].limit).toBe(500);
      expect(response.body[PolicyKeyList.AI_TOKEN_QUOTA].limit).toBe(2000);

      const storedLimit = await limitRepository.findOneByOrganizationIdAndKeyOrFail(
        organizationId,
        PolicyKeyList.MEDIA_STORAGE_LIMIT,
      );
      const storedQuota = await quotaRepository.findOneByOrganizationIdAndKeyOrFail(
        organizationId,
        PolicyKeyList.AI_TOKEN_QUOTA,
      );
      expect(storedLimit.getLimit()).toBe(500);
      expect(storedQuota.getLimit()).toBe(2000);
    });

    it("leaves policy keys that were not sent untouched", async () => {
      const organizationId = await seedOrganization();
      const before = await limitRepository.findOneByOrganizationIdAndKeyOrFail(
        organizationId,
        PolicyKeyList.PASSPORT_CREATE_LIMIT,
      );
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const cookie = await betterAuthHelper.signAsUser(admin.id);

      await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .set("Cookie", cookie)
        .send({ [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 })
        .expect(200);

      const after = await limitRepository.findOneByOrganizationIdAndKeyOrFail(
        organizationId,
        PolicyKeyList.PASSPORT_CREATE_LIMIT,
      );
      expect(after.getLimit()).toBe(before.getLimit());
    });

    it("rejects an empty body", async () => {
      const organizationId = await seedOrganization();
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const cookie = await betterAuthHelper.signAsUser(admin.id);

      await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .set("Cookie", cookie)
        .send({})
        .expect(400);
    });

    it("rejects an unknown policy key", async () => {
      const organizationId = await seedOrganization();
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const cookie = await betterAuthHelper.signAsUser(admin.id);

      await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .set("Cookie", cookie)
        .send({ NOT_A_POLICY: 10 })
        .expect(400);
    });

    it("rejects a negative limit", async () => {
      const organizationId = await seedOrganization();
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const cookie = await betterAuthHelper.signAsUser(admin.id);

      await request(app.getHttpServer())
        .patch(limitsPath(organizationId))
        .set("Cookie", cookie)
        .send({ [PolicyKeyList.MEDIA_STORAGE_LIMIT]: -1 })
        .expect(400);
    });

    it("returns 404 when the organization has no policies stored", async () => {
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const cookie = await betterAuthHelper.signAsUser(admin.id);

      await request(app.getHttpServer())
        .patch(limitsPath(randomUUID()))
        .set("Cookie", cookie)
        .send({ [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500 })
        .expect(404);
    });
  });
});
