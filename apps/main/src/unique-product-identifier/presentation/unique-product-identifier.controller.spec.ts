/**
 * Slices 41, 42 & 43 — UpiController GET (org-scoped list) + POST (create GS1 UPI)
 *                       + GET/PATCH/DELETE by id
 *
 * Integration suite using createAasTestContext + supertest.
 *
 * NOTE: The controller is registered via UniqueProductIdentifierModule (no explicit
 * `controllers` override), so that PassportService (a transitive dependency of the
 * POST handler) is resolved within the module scope.
 */
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
import { PermalinkDoc, PermalinkSchema } from "../../permalink/infrastructure/permalink.schema";
import { PermalinkModule } from "../../permalink/permalink.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { ExternalIdentifierType } from "./dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";

describe("UniqueProductIdentifierController", () => {
  const basePath = "/unique-product-identifiers";

  // The controller is registered through UniqueProductIdentifierModule — no explicit
  // `controllers` entry so NestJS resolves PassportService within the module scope.
  const ctx = createAasTestContext(
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

  async function createPassport(orgId: string, options: { published?: boolean } = {}) {
    const { aas, submodels } = ctx.getAasObjects();
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      lastStatusChange: options.published
        ? DigitalProductDocumentStatusChange.create({
            previousStatus: DigitalProductDocumentStatus.Draft,
            currentStatus: DigitalProductDocumentStatus.Published,
          })
        : DigitalProductDocumentStatusChange.create({}),
    });
    const moduleRef = ctx.getModuleRef();
    // Canonical UPI must carry organizationId so findAllByOrganizationId can include it.
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
      // Use a unique serial per test to avoid index collisions across the shared DB.
      const uniqueSerial = `C42A-${randomUUID().slice(0, 8)}`;

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({
          referenceId: passport.id,
          gtin: "4006381333931", // 13-digit EAN, normalizes to GTIN-14
          batch: "LOT-C42",
          serial: uniqueSerial,
        });

      expect(response.status).toEqual(201);
      expect(response.body.referenceId).toEqual(passport.id);
      expect(response.body.gtin).toEqual("04006381333931"); // normalized GTIN-14
      expect(response.body.batch).toEqual("LOT-C42");
      expect(response.body.serial).toEqual(uniqueSerial);
      expect(response.body.uuid).toBeDefined();
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

    it("returns 409 when the passport is published (lifecycle freeze)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { published: true });

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send({ referenceId: passport.id, gtin: "04006381333931" });

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
      // The partial unique index on (gtin, batch, serial) is built asynchronously by
      // Mongoose autoIndex; under the full parallel suite it may not exist yet when this
      // test runs, letting the duplicate insert succeed (201) instead of 409. Build it
      // deterministically first (mirrors permalink.repository.spec.ts).
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
        .send({ referenceId: passport.id, gtin: "0400638133393X" }); // invalid

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
      expect(response.body.type).toEqual(ExternalIdentifierType.OPEN_DPP_UUID);
      expect(response.body.gtin).toBeNull();
      expect(response.body.digitalLink).toBeNull();
      expect(response.body.uuid).toBeDefined();
    });

    it("returns 409 when the passport is published (lifecycle freeze)", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id, { published: true });

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
          row.type === ExternalIdentifierType.OPEN_DPP_UUID && row.referenceId === passport.id,
      );
      expect(openDppRow).toBeDefined();
      expect(openDppRow.referenceId).toEqual(passport.id);
      expect(openDppRow.type).toEqual(ExternalIdentifierType.OPEN_DPP_UUID);
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
        (row: { type: string }) => row.type === ExternalIdentifierType.GS1,
      );
      expect(gs1Row).toBeDefined();
      expect(gs1Row.type).toEqual(ExternalIdentifierType.GS1);
      expect(gs1Row.referenceId).toEqual(passport.id);
      expect(gs1Row.gtin).toEqual("04006381333931");
      expect(gs1Row.batch).toEqual("LOT-1");
      expect(gs1Row.serial).toEqual("SN-1");
    });

    it("excludes UPIs belonging to other organizations", async () => {
      const { app, getOrganizationAndUserWithCookie, betterAuthHelper } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      // Create a passport for the requesting org
      await createPassport(org!.id);
      // Create a passport for a separate org
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
      // No rows from the other org should appear
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
      // createPassport seeds the canonical OPEN_DPP_UUID row; add two GS1 rows so the
      // org has three UPIs total → limit:2 yields a full first page plus a remainder.
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
      // A user who belongs to no org makes the request
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

  // ---------------------------------------------------------------------------
  // Slice 43 — GET/PATCH/DELETE /:id
  // ---------------------------------------------------------------------------

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
      // Org A owns the passport and UPI
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

      // User B is a member of org B, not org A
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
      // The canonical OPEN_DPP_UUID row was created by createPassport
      const repo = moduleRef.get(UniqueProductIdentifierRepository);
      const allUpis = await repo.findAllByReferencedId(passport.id);
      const systemUpi = allUpis.find((u) => u.type === ExternalIdentifierType.OPEN_DPP_UUID);
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

      // The GS1 UPI row must be gone
      const gone = await moduleRef.get(UniqueProductIdentifierRepository).findOne(savedUpi.uuid);
      expect(gone).toBeUndefined();

      // The canonical OPEN_DPP_UUID row must still exist
      const remaining = await moduleRef
        .get(UniqueProductIdentifierRepository)
        .findAllByReferencedId(passport.id);
      const canonicalRow = remaining.find((u) => u.type === ExternalIdentifierType.OPEN_DPP_UUID);
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
      const internalUpi = allUpis.find((u) => u.type === ExternalIdentifierType.OPEN_DPP_UUID);
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

  // ---------------------------------------------------------------------------
  // Passport-scoped list — GET /passports/:id/unique-product-identifiers
  // ---------------------------------------------------------------------------
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
      // A different passport's UPI must NOT appear in this passport's list.
      const otherPassport = await createPassport(org!.id);

      const response = await request(app.getHttpServer())
        .get(`/passports/${passport.id}/unique-product-identifiers`)
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
      expect(types).toContain(ExternalIdentifierType.OPEN_DPP_UUID);
      expect(types).toContain(ExternalIdentifierType.GS1);
    });

    it("paginates via ?limit and ?cursor — the second page does not overlap the first", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();
      const passport = await createPassport(org!.id); // canonical UPI seeded → 1
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
        .get(`/passports/${passport.id}/unique-product-identifiers`)
        .query({ limit: 2 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org!.id)
        .send();
      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(2);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(app.getHttpServer())
        .get(`/passports/${passport.id}/unique-product-identifiers`)
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
        .get(`/passports/${passport.id}/unique-product-identifiers`)
        .set("Cookie", userBCookie)
        .set(ORGANIZATION_ID_HEADER, orgB.id)
        .send();

      expect(response.status).toEqual(403);
    });

    it("returns 404 when the passport does not exist", async () => {
      const { app, getOrganizationAndUserWithCookie } = ctx.globals();
      const { org, userCookie } = await getOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`/passports/${randomUUID()}/unique-product-identifiers`)
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
        .get(`/passports/${passport.id}/unique-product-identifiers`)
        .set("Cookie", userCookie)
        .send();

      expect(response.status).toEqual(400);
    });
  });
});
