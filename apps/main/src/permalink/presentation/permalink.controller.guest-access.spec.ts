import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { VersioningType } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import {
  AllApiVersions,
  LatestApiVersionWithPrefixDto,
  PermissionKind,
  Permissions,
} from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import {
  aasPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
} from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { AasModule } from "../../aas/aas.module";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { Environment } from "../../aas/domain/environment";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { Permission } from "../../aas/domain/security/permission";
import { Security } from "../../aas/domain/security/security";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { generateMongoConfig } from "../../database/config";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { GuestAccessService } from "../../identity/guest-access/application/services/guest-access.service";
import { GuestRole } from "../../identity/guest-access/domain/guest-role.enum";
import { GuestAccessModule } from "../../identity/guest-access/guest-access.module";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { UsersRepository } from "../../identity/users/infrastructure/adapters/users.repository";
import { UsersModule } from "../../identity/users/users.module";
import { MediaModule } from "../../media/media.module";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import { PermalinkModule } from "../permalink.module";

describe("PermalinkController — who sees what", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let guestAccessService: GuestAccessService;
  let usersRepository: UsersRepository;
  let passportRepository: PassportRepository;
  let presentationConfigurationRepository: PresentationConfigurationRepository;
  let permalinkRepository: PermalinkRepository;
  let forRepairers: Submodel;
  let forPublic: Submodel;
  let aas: AssetAdministrationShell;
  const betterAuthHelper = new BetterAuthHelper();

  const read = [
    Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
  ];
  const owner = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER });
  const repairer = SubjectAttributes.create({
    userRole: UserRole.USER,
    guestRole: GuestRole.REPAIRER,
  });
  const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        EventEmitterModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        ActivityHistoryModule,
        AasModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
        MediaModule,
        GuestAccessModule,
        PermalinkModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
    })
      .overrideProvider(EmailService)
      .useValue({ send: jest.fn() })
      .compile();

    betterAuthHelper.init(moduleRef.get(UsersService), moduleRef.get<Auth>(AUTH));
    guestAccessService = moduleRef.get(GuestAccessService);
    usersRepository = moduleRef.get(UsersRepository);
    passportRepository = moduleRef.get(PassportRepository, { strict: false });
    presentationConfigurationRepository = moduleRef.get(PresentationConfigurationRepository, {
      strict: false,
    });
    permalinkRepository = moduleRef.get(PermalinkRepository, { strict: false });

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(
      new NotFoundInDatabaseExceptionFilter(),
      new NotFoundExceptionFilter(),
      new ValueErrorFilter(),
      new ForbiddenExceptionFilter(),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: AllApiVersions });
    await app.init();

    // One shell with two submodels: the first is readable for repairers only, the second for the
    // public only. Members see both. Guests do not fall back to the public rules, so a repairer
    // sees the first one and not the second.
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    forRepairers = Submodel.fromPlain(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    forPublic = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const security = Security.create({});
    for (const [subject, submodel] of [
      [owner, forRepairers],
      [owner, forPublic],
      [repairer, forRepairers],
      [anonymous, forPublic],
    ] as const) {
      security.addPolicy(subject, IdShortPath.create({ path: submodel.idShort }), read);
    }
    aas = AssetAdministrationShell.fromPlain(
      aasPlainFactory.build({ security: security.toPlain() }, { transient: { iriDomain } }),
    );
    await moduleRef.get(AasRepository).save(aas);
    await moduleRef.get(SubmodelRepository).save(forRepairers);
    await moduleRef.get(SubmodelRepository).save(forPublic);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createOwner() {
    return await betterAuthHelper.createOrganizationAndUserWithCookie();
  }

  async function createPassport(organizationId: string, published = true) {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: [forRepairers.id, forPublic.id],
        conceptDescriptions: [],
      }),
      lastStatusChange: published
        ? DigitalProductDocumentStatusChange.create({
            previousStatus: DigitalProductDocumentStatus.Draft,
            currentStatus: DigitalProductDocumentStatus.Published,
          })
        : DigitalProductDocumentStatusChange.create({}),
    });
    const config = PresentationConfiguration.createForPassport({
      organizationId,
      referenceId: passport.id,
    });
    const permalink = Permalink.create({
      passportId: passport.id,
      presentationConfigurationId: config.id,
    });
    await passportRepository.save(passport);
    await presentationConfigurationRepository.save(config);
    await permalinkRepository.save(permalink);
    return permalink;
  }

  async function createGuest(
    organization: Awaited<ReturnType<typeof createOwner>>,
    options: { accept?: boolean } = {},
  ) {
    const email = `guest-${randomUUID()}@example.com`;
    const guestAccess = await guestAccessService.invite({
      organizationId: organization.org.id,
      actingUserId: organization.user.id,
      email,
      guestRole: GuestRole.REPAIRER,
    });
    const { user } = await betterAuthHelper.createUser({ email });
    if (options.accept !== false) {
      await guestAccessService.accept(guestAccess.id, await usersRepository.findOneOrFail(user.id));
    }
    const { userCookie } = await betterAuthHelper.getUserWithCookie(user.id);
    return { guestAccess, userCookie };
  }

  async function submodelIdsSeenBy(permalinkId: string, cookie?: string, organizationId?: string) {
    const req = request(app.getHttpServer()).get(
      `/${LatestApiVersionWithPrefixDto}/p/${permalinkId}/submodels`,
    );
    if (cookie) req.set("Cookie", cookie);
    if (organizationId) req.set(ORGANIZATION_ID_HEADER, organizationId);
    const response = await req.send();
    expect(response.status).toEqual(200);
    return response.body.result.map((s: { id: string }) => s.id) as string[];
  }

  it("shows an accepted guest the fields of the guest role, and not the public ones without a guest rule", async () => {
    const organization = await createOwner();
    const permalink = await createPassport(organization.org.id);
    const guest = await createGuest(organization);

    expect(await submodelIdsSeenBy(permalink.id, guest.userCookie)).toEqual([forRepairers.id]);
  });

  it("shows anonymous visitors and signed in strangers only the public fields", async () => {
    const organization = await createOwner();
    const permalink = await createPassport(organization.org.id);
    const stranger = await createOwner();

    expect(await submodelIdsSeenBy(permalink.id)).toEqual([forPublic.id]);
    expect(await submodelIdsSeenBy(permalink.id, stranger.userCookie)).toEqual([forPublic.id]);
  });

  it("shows a pending, a revoked and a foreign guest access nothing extra", async () => {
    const organization = await createOwner();
    const permalink = await createPassport(organization.org.id);
    const pending = await createGuest(organization, { accept: false });
    const revoked = await createGuest(organization);
    await guestAccessService.revoke({
      organizationId: organization.org.id,
      guestAccessId: revoked.guestAccess.id,
      actingUserId: organization.user.id,
    });
    const foreign = await createGuest(await createOwner());

    for (const { userCookie } of [pending, revoked, foreign]) {
      expect(await submodelIdsSeenBy(permalink.id, userCookie)).toEqual([forPublic.id]);
    }
  });

  it("does not let a member of another organization act as a member through the header", async () => {
    const organization = await createOwner();
    const permalink = await createPassport(organization.org.id);
    const other = await createOwner();

    expect(await submodelIdsSeenBy(permalink.id, other.userCookie, other.org.id)).toEqual([
      forPublic.id,
    ]);
  });

  it("shows a member of the owning organization everything", async () => {
    const organization = await createOwner();
    const permalink = await createPassport(organization.org.id);

    const seen = await submodelIdsSeenBy(
      permalink.id,
      organization.userCookie,
      organization.org.id,
    );

    expect(seen.sort()).toEqual([forRepairers.id, forPublic.id].sort());
  });

  it("does not show draft passports to guests", async () => {
    const organization = await createOwner();
    const draft = await createPassport(organization.org.id, false);
    const guest = await createGuest(organization);

    const response = await request(app.getHttpServer())
      .get(`/${LatestApiVersionWithPrefixDto}/p/${draft.id}/submodels`)
      .set("Cookie", guest.userCookie);

    expect(response.status).toEqual(404);
  });

  it("ends the access with the next request after a revocation", async () => {
    const organization = await createOwner();
    const permalink = await createPassport(organization.org.id);
    const guest = await createGuest(organization);
    expect(await submodelIdsSeenBy(permalink.id, guest.userCookie)).toEqual([forRepairers.id]);

    await guestAccessService.revoke({
      organizationId: organization.org.id,
      guestAccessId: guest.guestAccess.id,
      actingUserId: organization.user.id,
    });

    expect(await submodelIdsSeenBy(permalink.id, guest.userCookie)).toEqual([forPublic.id]);
  });
});
