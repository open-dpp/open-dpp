import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import request from "supertest";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { PermalinkKind, UniqueProductIdentifierType } from "@open-dpp/dto";
import { Permalink } from "../../permalink/domain/permalink";
import { PermalinkRepository } from "../../permalink/infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../../permalink/infrastructure/permalink.schema";
import { PermalinkModule } from "../../permalink/permalink.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";

describe("UniqueProductIdentifierController", () => {
  const basePath = "/v1/unique-product-identifiers";

  const ctx = createAasTestContext(
    basePath,
    basePath,
    {
      imports: [
        UniqueProductIdentifierModule,
        PermalinkModule,
        PresentationConfigurationsModule,
        InstanceSettingsModule,
      ],
      providers: [UniqueProductIdentifierRepository, PassportRepository],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PassportRepository,
    SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
  );

  function lastStatusChangeFor(options: { published?: boolean; archived?: boolean }) {
    if (options.archived) {
      return DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      });
    }
    if (options.published) {
      return DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Published,
      });
    }
    return DigitalProductDocumentStatusChange.create({});
  }

  async function createPassport(
    orgId: string,
    options: { published?: boolean; archived?: boolean } = {},
  ) {
    const { aas, submodels } = ctx.getAasObjects();
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      lastStatusChange: lastStatusChangeFor(options),
    });
    const moduleRef = ctx.getModuleRef();
    await moduleRef
      .get(UniqueProductIdentifierRepository)
      .save(passport.createUniqueProductIdentifier().withOrganizationId(orgId));
    await moduleRef.get(PassportRepository).save(passport);
    return passport;
  }

  describe("POST /unique-product-identifiers (create)", () => {
    it("returns 201 with the created GS1 UPI including referenceId, normalized gtin (GTIN-14), and digitalLink", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const uniqueSerial = `C42A-${randomUUID().slice(0, 8)}`;

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({
          referenceId: passport.id,
          gtin: "4006381333931",
          batch: "LOT-C42",
          serial: uniqueSerial,
        });

      expect(response.status).toEqual(201);
      expect(response.body.referenceId).toEqual(passport.id);
      expect(response.body.gtin).toEqual("04006381333931");
      expect(response.body.batch).toEqual("LOT-C42");
      expect(response.body.serial).toEqual(uniqueSerial);
      expect(response.body.uuid).toBeDefined();
      expect(response.body.type).toEqual("GS1");
      expect(response.body.passportPublished).toEqual(false);
      expect(response.body.permalink).toBeNull();
    });

    it("returns 201 for a second POST for the SAME passport with a distinct serial (many-per-passport)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const uniqueBase = randomUUID().slice(0, 8);

      await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id, gtin: "04006381333931", serial: `C42B-${uniqueBase}-1` });

      const response2 = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id, gtin: "04006381333931", serial: `C42B-${uniqueBase}-2` });

      expect(response2.status).toEqual(201);
      expect(response2.body.serial).toEqual(`C42B-${uniqueBase}-2`);
    });

    it("returns 201 when the passport is published (adding an identity is allowed)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { published: true });
      const uniqueSerial = `PUB-${randomUUID().slice(0, 8)}`;

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id, gtin: "04006381333931", serial: uniqueSerial });

      expect(response.status).toEqual(201);
      expect(response.body.passportPublished).toEqual(true);
    });

    it("returns 409 when the passport is archived", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { archived: true });

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: `ARC-${randomUUID().slice(0, 8)}`,
        });

      expect(response.status).toEqual(409);
    });

    it("returns 403 when the requester is not a member of the org (cross-org)", async () => {
      const { app, betterAuthHelper } = ctx.globals();
      const nonMemberData = await betterAuthHelper.createUser();
      const nonMemberCookie = await betterAuthHelper.signAsUser(nonMemberData.user.id);
      const { org: someOrg } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      const moduleRef = ctx.getModuleRef();
      const { aas, submodels } = ctx.getAasObjects();
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: someOrg.id,
        environment: Environment.create({
          assetAdministrationShells: [aas.id],
          submodels: submodels.map((s) => s.id),
          conceptDescriptions: [],
        }),
        lastStatusChange: DigitalProductDocumentStatusChange.create({}),
      });
      await moduleRef.get(PassportRepository).save(passport);

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", nonMemberCookie)
        .set(ORGANIZATION_ID_HEADER, someOrg.id)
        .send({ referenceId: passport.id, gtin: "04006381333931" });

      expect(response.status).toEqual(403);
    });

    it("returns 409 when the same full GS1 key (gtin+batch+serial) already exists (duplicate key)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      await (
        app.get(getModelToken(UniqueProductIdentifierDoc.name)) as Model<UniqueProductIdentifierDoc>
      ).syncIndexes();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const uniqueSerial = `C42D-${randomUUID().slice(0, 8)}`;

      const body = {
        referenceId: passport.id,
        gtin: "04006381333931",
        batch: "LOT-DUP",
        serial: uniqueSerial,
      };
      await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send(body);

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send(body);

      expect(response.status).toEqual(409);
    });

    it("returns 400 when the GTIN has an invalid check digit", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id, gtin: "0400638133393X" });

      expect(response.status).toEqual(400);
    });
  });

  describe("POST /unique-product-identifiers/internal (create internal — ADR 0005)", () => {
    it("returns 201 with an internal UPI (type OPEN_DPP_UUID, null gtin/digitalLink)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);

      const response = await request(app.getHttpServer())
        .post(`${basePath}/internal`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id });

      expect(response.status).toEqual(201);
      expect(response.body.referenceId).toEqual(passport.id);
      expect(response.body.type).toEqual(UniqueProductIdentifierType.OPEN_DPP_UUID);
      expect(response.body.gtin).toBeNull();
      expect(response.body.digitalLink).toBeNull();
      expect(response.body.uuid).toBeDefined();
    });

    it("returns 201 when the passport is published (adding an identity is allowed)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { published: true });

      const response = await request(app.getHttpServer())
        .post(`${basePath}/internal`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id });

      expect(response.status).toEqual(201);
      expect(response.body.passportPublished).toEqual(true);
    });

    it("returns 409 when the passport is archived", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { archived: true });

      const response = await request(app.getHttpServer())
        .post(`${basePath}/internal`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id });

      expect(response.status).toEqual(409);
    });
  });

  describe("GET /unique-product-identifiers (list)", () => {
    it("returns 200 with an array containing the canonical OPEN_DPP_UUID UPI for the org", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.paging_metadata).toBeDefined();
      expect(Array.isArray(response.body.result)).toBe(true);
      const openDppRow = response.body.result.find(
        (row: { type: string; referenceId: string }) =>
          row.type === UniqueProductIdentifierType.OPEN_DPP_UUID && row.referenceId === passport.id,
      );
      expect(openDppRow).toBeDefined();
      expect(openDppRow.referenceId).toEqual(passport.id);
      expect(openDppRow.type).toEqual(UniqueProductIdentifierType.OPEN_DPP_UUID);
    });

    it("returns 200 including GS1 UPIs for the org and exposes type/referenceId/gtin/batch/serial", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          batch: "LOT-1",
          serial: "SN-1",
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      const gs1Row = response.body.result.find(
        (row: { type: string }) => row.type === UniqueProductIdentifierType.GS1,
      );
      expect(gs1Row).toBeDefined();
      expect(gs1Row.type).toEqual(UniqueProductIdentifierType.GS1);
      expect(gs1Row.referenceId).toEqual(passport.id);
      expect(gs1Row.gtin).toEqual("04006381333931");
      expect(gs1Row.batch).toEqual("LOT-1");
      expect(gs1Row.serial).toEqual("SN-1");
    });

    it("enriches a GS1 row with its gs1-link permalink summary; unlinked rows carry null", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const upiRepo = moduleRef.get(UniqueProductIdentifierRepository);
      const linkedUpi = await upiRepo.save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: `LN-${randomUUID().slice(0, 8)}`,
          organizationId: org!.id,
        }),
      );
      await upiRepo.save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: `UN-${randomUUID().slice(0, 8)}`,
          organizationId: org!.id,
        }),
      );
      const permalink = await moduleRef.get(PermalinkRepository).save(
        Permalink.create({
          kind: PermalinkKind.GS1_LINK,
          passportId: passport.id,
          uniqueProductIdentifierId: linkedUpi.uuid,
          presentationConfigurationId: null,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      const rows = new Map(
        response.body.result.map((row: { uuid: string }) => [row.uuid, row]),
      ) as Map<string, { permalink: { id: string; publicUrl: string } | null }>;
      const linkedRow = rows.get(linkedUpi.uuid);
      expect(linkedRow?.permalink).toBeDefined();
      expect(linkedRow?.permalink?.id).toEqual(permalink.id);
      expect(linkedRow?.permalink?.publicUrl).toMatch(/^https?:\/\//);
      const unlinkedRows = response.body.result.filter(
        (row: { uuid: string }) => row.uuid !== linkedUpi.uuid,
      );
      expect(unlinkedRows.length).toBeGreaterThan(0);
      for (const row of unlinkedRows) {
        expect(row.permalink).toBeNull();
      }
    });

    it("excludes UPIs belonging to other organizations", async () => {
      const { app, getOrganizationAndUserWithCookie, betterAuthHelper } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      await createPassport(org!.id);
      const { org: otherOrg } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      const moduleRef = ctx.getModuleRef();
      const otherOrgAas = ctx.getAasObjects().aas;
      const otherOrgPassport = Passport.create({
        id: randomUUID(),
        organizationId: otherOrg.id,
        environment: Environment.create({
          assetAdministrationShells: [otherOrgAas.id],
          submodels: [],
          conceptDescriptions: [],
        }),
        lastStatusChange: DigitalProductDocumentStatusChange.create({}),
      });
      await moduleRef
        .get(UniqueProductIdentifierRepository)
        .save(otherOrgPassport.createUniqueProductIdentifier().withOrganizationId(otherOrg.id));
      await moduleRef.get(PassportRepository).save(otherOrgPassport);

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      const otherOrgRows = response.body.result.filter(
        (row: { referenceId: string }) => row.referenceId === otherOrgPassport.id,
      );
      expect(otherOrgRows).toHaveLength(0);
    });

    it("paginates via ?limit and ?cursor — the second page does not overlap the first", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      for (let i = 0; i < 2; i++) {
        await moduleRef.get(UniqueProductIdentifierRepository).save(
          UniqueProductIdentifier.createGs1({
            referenceId: passport.id,
            gtin: "04006381333931",
            serial: `PAGE-${randomUUID().slice(0, 8)}`,
            organizationId: org!.id,
          }),
        );
      }

      const page1 = await request(app.getHttpServer())
        .get(basePath)
        .query({ limit: 2 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(2);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(app.getHttpServer())
        .get(basePath)
        .query({ limit: 2, cursor: page1.body.paging_metadata.cursor })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(page2.status).toEqual(200);
      expect(page2.body.result.length).toBeGreaterThanOrEqual(1);

      const page1Uuids = page1.body.result.map((row: { uuid: string }) => row.uuid);
      const page2Uuids = page2.body.result.map((row: { uuid: string }) => row.uuid);
      expect(page1Uuids.some((uuid: string) => page2Uuids.includes(uuid))).toBe(false);
    });

    it("returns 400 when the org header is missing", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { userCookie } = await getOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("Cookie", userCookie)
        .send();

      expect(response.status).toEqual(400);
    });

    it("returns 403 when the requester is not a member of the org", async () => {
      const { app, betterAuthHelper } = ctx.globals();
      const nonMemberData = await betterAuthHelper.createUser();
      const nonMemberCookie = await betterAuthHelper.signAsUser(nonMemberData.user.id);
      const { org: someOrg } = await betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("Cookie", nonMemberCookie)
        .set(ORGANIZATION_ID_HEADER, someOrg.id)
        .send();

      expect(response.status).toEqual(403);
    });
  });

  describe("GET /unique-product-identifiers/:id", () => {
    it("returns the GS1 UPI including digitalLink", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const uniqueSerial = `C43-GET-${randomUUID().slice(0, 8)}`;
      const savedUpi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          batch: "LOT-43",
          serial: uniqueSerial,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`${basePath}/${savedUpi.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.uuid).toEqual(savedUpi.uuid);
      expect(response.body.referenceId).toEqual(passport.id);
      expect(response.body.gtin).toEqual("04006381333931");
      expect(response.body.batch).toEqual("LOT-43");
      expect(response.body.serial).toEqual(uniqueSerial);
      expect(response.body.digitalLink).toBeDefined();
    });

    it("returns 404 when the UPI does not exist", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`${basePath}/${randomUUID()}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(404);
    });

    it("returns 403 when the requester is not a member of the UPI's owning org (cross-org)", async () => {
      const { app, betterAuthHelper } = ctx.globals();
      const { org: orgA } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      const moduleRef = ctx.getModuleRef();
      const { aas, submodels } = ctx.getAasObjects();
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgA.id,
        environment: Environment.create({
          assetAdministrationShells: [aas.id],
          submodels: submodels.map((s) => s.id),
          conceptDescriptions: [],
        }),
        lastStatusChange: DigitalProductDocumentStatusChange.create({}),
      });
      await moduleRef.get(PassportRepository).save(passport);
      const uniqueSerial = `C43-CROSS-${randomUUID().slice(0, 8)}`;
      const upi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: uniqueSerial,
          organizationId: orgA.id,
        }),
      );

      const { org: orgB, userCookie: userBCookie } =
        await betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`${basePath}/${upi.uuid}`)
        .set("Cookie", userBCookie)
        .set(ORGANIZATION_ID_HEADER, orgB.id)
        .send();

      expect(response.status).toEqual(403);
    });
  });

  describe("PATCH /unique-product-identifiers/:id", () => {
    it("updates batch/serial/gtin on a GS1 UPI of a DRAFT passport → 200 with recomputed digitalLink", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const uniqueSerial = `C43-PATCH-${randomUUID().slice(0, 8)}`;
      const savedUpi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          batch: "ORIG-BATCH",
          serial: uniqueSerial,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .patch(`${basePath}/${savedUpi.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ gtin: "04006381333931", batch: "NEW-BATCH", serial: uniqueSerial });

      expect(response.status).toEqual(200);
      expect(response.body.uuid).toEqual(savedUpi.uuid);
      expect(response.body.batch).toEqual("NEW-BATCH");
      expect(response.body.digitalLink).toBeDefined();
      expect(response.body.type).toEqual("GS1");
    });

    it("returns 409 when the passport is published (lifecycle freeze)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { published: true });
      const moduleRef = ctx.getModuleRef();
      const uniqueSerial = `P43PUB${randomUUID().slice(0, 8)}`;
      const savedUpi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: uniqueSerial,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .patch(`${basePath}/${savedUpi.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ gtin: "04006381333931", serial: uniqueSerial });

      expect(response.status).toEqual(409);
    });

    it("returns 409 when the UPI is a system (OPEN_DPP_UUID) row (read-only)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const repo = moduleRef.get(UniqueProductIdentifierRepository);
      const allUpis = await repo.findAllByReferencedId(passport.id);
      const systemUpi = allUpis.find((u) => u.type === UniqueProductIdentifierType.OPEN_DPP_UUID);
      expect(systemUpi).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`${basePath}/${systemUpi!.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ gtin: "04006381333931" });

      expect(response.status).toEqual(409);
    });
  });

  describe("DELETE /unique-product-identifiers/:id", () => {
    it("deletes a GS1 UPI on a DRAFT passport → 204, row is gone, canonical OPEN_DPP_UUID survives", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const uniqueSerial = `C43-DEL-${randomUUID().slice(0, 8)}`;
      const savedUpi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: uniqueSerial,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .delete(`${basePath}/${savedUpi.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(204);

      const gone = await moduleRef.get(UniqueProductIdentifierRepository).findOne(savedUpi.uuid);
      expect(gone).toBeUndefined();

      const remaining = await moduleRef
        .get(UniqueProductIdentifierRepository)
        .findAllByReferencedId(passport.id);
      const canonicalRow = remaining.find(
        (u) => u.type === UniqueProductIdentifierType.OPEN_DPP_UUID,
      );
      expect(canonicalRow).toBeDefined();
    });

    it("returns 409 when the passport is published (lifecycle freeze)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { published: true });
      const moduleRef = ctx.getModuleRef();
      const uniqueSerial = `C43-DEL-PUB-${randomUUID().slice(0, 8)}`;
      const savedUpi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: uniqueSerial,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .delete(`${basePath}/${savedUpi.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(409);
    });

    it("deletes an internal (OPEN_DPP_UUID) UPI on a DRAFT passport → 204, row is gone (ADR 0006)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const repo = moduleRef.get(UniqueProductIdentifierRepository);
      const allUpis = await repo.findAllByReferencedId(passport.id);
      const internalUpi = allUpis.find((u) => u.type === UniqueProductIdentifierType.OPEN_DPP_UUID);
      expect(internalUpi).toBeDefined();

      const response = await request(app.getHttpServer())
        .delete(`${basePath}/${internalUpi!.uuid}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(204);
      const remaining = await repo.findAllByReferencedId(passport.id);
      expect(remaining.find((u) => u.uuid === internalUpi!.uuid)).toBeUndefined();
    });
  });

  describe("GET /passports/:id/unique-product-identifiers", () => {
    it("returns 200 with the passport's UPIs (canonical + GS1) in an envelope, scoped to the passport", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: `PS-${randomUUID().slice(0, 8)}`,
          organizationId: org!.id,
        }),
      );
      const otherPassport = await createPassport(org!.id);

      const response = await request(app.getHttpServer())
        .get(`/v1/passports/${passport.id}/unique-product-identifiers`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.paging_metadata).toBeDefined();
      expect(Array.isArray(response.body.result)).toBe(true);
      const refs = response.body.result.map((r: { referenceId: string }) => r.referenceId);
      expect(refs.length).toBeGreaterThan(0);
      expect(refs.every((ref: string) => ref === passport.id)).toBe(true);
      expect(refs).not.toContain(otherPassport.id);
      const types = response.body.result.map((r: { type: string }) => r.type);
      expect(types).toContain(UniqueProductIdentifierType.OPEN_DPP_UUID);
      expect(types).toContain(UniqueProductIdentifierType.GS1);
    });

    it("enriches a GS1 row with its gs1-link permalink summary in the passport-scoped list", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      const linkedUpi = await moduleRef.get(UniqueProductIdentifierRepository).save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "04006381333931",
          serial: `PL-${randomUUID().slice(0, 8)}`,
          organizationId: org!.id,
        }),
      );
      const permalink = await moduleRef.get(PermalinkRepository).save(
        Permalink.create({
          kind: PermalinkKind.GS1_LINK,
          passportId: passport.id,
          uniqueProductIdentifierId: linkedUpi.uuid,
          presentationConfigurationId: null,
          organizationId: org!.id,
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`/v1/passports/${passport.id}/unique-product-identifiers`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(200);
      const linkedRow = response.body.result.find(
        (row: { uuid: string }) => row.uuid === linkedUpi.uuid,
      );
      expect(linkedRow.permalink.id).toEqual(permalink.id);
      expect(linkedRow.permalink.publicUrl).toMatch(/^https?:\/\//);
      const systemRow = response.body.result.find(
        (row: { type: string }) => row.type === UniqueProductIdentifierType.OPEN_DPP_UUID,
      );
      expect(systemRow.permalink).toBeNull();
    });

    it("paginates via ?limit and ?cursor — the second page does not overlap the first", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);
      const moduleRef = ctx.getModuleRef();
      for (let i = 0; i < 2; i++) {
        await moduleRef.get(UniqueProductIdentifierRepository).save(
          UniqueProductIdentifier.createGs1({
            referenceId: passport.id,
            gtin: "04006381333931",
            serial: `PSP-${randomUUID().slice(0, 8)}`,
            organizationId: org!.id,
          }),
        );
      }

      const page1 = await request(app.getHttpServer())
        .get(`/v1/passports/${passport.id}/unique-product-identifiers`)
        .query({ limit: 2 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();
      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(2);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(app.getHttpServer())
        .get(`/v1/passports/${passport.id}/unique-product-identifiers`)
        .query({ limit: 2, cursor: page1.body.paging_metadata.cursor })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();
      expect(page2.status).toEqual(200);
      expect(page2.body.result.length).toBeGreaterThanOrEqual(1);
      const p1 = page1.body.result.map((r: { uuid: string }) => r.uuid);
      const p2 = page2.body.result.map((r: { uuid: string }) => r.uuid);
      expect(p1.some((u: string) => p2.includes(u))).toBe(false);
    });

    it("returns 403 for a cross-org / non-member request", async () => {
      const { app, betterAuthHelper } = ctx.globals();
      const { org: orgA } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      const passport = await createPassport(orgA.id);
      const { org: orgB, userCookie: userBCookie } =
        await betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`/v1/passports/${passport.id}/unique-product-identifiers`)
        .set("Cookie", userBCookie)
        .set(ORGANIZATION_ID_HEADER, orgB.id)
        .send();

      expect(response.status).toEqual(403);
    });

    it("returns 404 when the passport does not exist", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`/v1/passports/${randomUUID()}/unique-product-identifiers`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();

      expect(response.status).toEqual(404);
    });

    it("returns 400 when the org header is missing", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id);

      const response = await request(app.getHttpServer())
        .get(`/v1/passports/${passport.id}/unique-product-identifiers`)
        .set("Cookie", userCookie)
        .send();

      expect(response.status).toEqual(400);
    });
  });
});
