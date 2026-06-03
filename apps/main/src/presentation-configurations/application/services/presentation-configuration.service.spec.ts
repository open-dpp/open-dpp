import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";
import {
  KeyTypes,
  PermissionKind,
  Permissions,
  PresentationComponentName,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ForbiddenError, NotFoundError } from "@open-dpp/exception";
import type { Connection } from "mongoose";

import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { Environment } from "../../../aas/domain/environment";
import { Permission } from "../../../aas/domain/security/permission";
import { Security } from "../../../aas/domain/security/security";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { generateMongoConfig } from "../../../database/config";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../infrastructure/presentation-configuration.schema";
import {
  PresentationConfigurationService,
  PresentationReferenceHolder,
} from "./presentation-configuration.service";

describe("PresentationConfigurationService", () => {
  let service: PresentationConfigurationService;
  let connection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
        ]),
      ],
      providers: [PresentationConfigurationService, PresentationConfigurationRepository],
    }).compile();

    service = module.get(PresentationConfigurationService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterEach(async () => {
    await connection.collection("presentationconfigurationdocs").deleteMany({});
  });

  afterAll(async () => {
    await module.close();
  });

  function makePassport(opts: { templateId?: string } = {}): Passport {
    return Passport.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
      templateId: opts.templateId,
    });
  }

  function makeTemplate(): Template {
    return Template.create({
      organizationId: randomUUID(),
      environment: Environment.create({}),
    });
  }

  function passportHolder(passport: Passport): PresentationReferenceHolder {
    return {
      id: passport.id,
      organizationId: passport.organizationId,
      referenceType: PresentationReferenceType.Passport,
    };
  }

  function templateHolder(template: Template): PresentationReferenceHolder {
    return {
      id: template.id,
      organizationId: template.organizationId,
      referenceType: PresentationReferenceType.Template,
    };
  }

  describe("list (passport)", () => {
    it("lazy-creates a default config when none exist", async () => {
      const passport = makePassport();
      const list = await service.list(passportHolder(passport));
      expect(list).toHaveLength(1);
      expect(list[0].label).toBeNull();

      const again = await service.list(passportHolder(passport));
      expect(again).toHaveLength(1);
      expect(again[0].id).toBe(list[0].id);
    });

    it("returns existing configs sorted by createdAt", async () => {
      const passport = makePassport();
      await service.list(passportHolder(passport));
      await service.create(passportHolder(passport), { label: "Variant A" });
      const list = await service.list(passportHolder(passport));
      expect(list).toHaveLength(2);
      expect(list[0].label).toBeNull();
      expect(list[1].label).toBe("Variant A");
    });
  });

  describe("create (passport)", () => {
    it("creates a new config with the given label", async () => {
      const passport = makePassport();
      const created = await service.create(passportHolder(passport), { label: "v1" });
      expect(created.label).toBe("v1");
      expect(created.referenceId).toBe(passport.id);
      expect(created.referenceType).toBe("passport");
    });
  });

  describe("delete (passport)", () => {
    it("removes a config by id", async () => {
      const passport = makePassport();
      const created = await service.create(passportHolder(passport), { label: "v1" });
      await service.delete(passportHolder(passport), created.id);
      const list = await service.list(passportHolder(passport));
      expect(list.find((c) => c.id === created.id)).toBeUndefined();
    });

    it("rejects deletion of a config belonging to another reference", async () => {
      const passportA = makePassport();
      const passportB = makePassport();
      const configForB = await service.create(passportHolder(passportB), { label: "B-config" });

      await expect(service.delete(passportHolder(passportA), configForB.id)).rejects.toThrow(
        NotFoundError,
      );

      const stillThere = await service.getById(passportHolder(passportB), configForB.id);
      expect(stillThere.id).toBe(configForB.id);
    });
  });

  describe("getEffective (passport, no merge)", () => {
    it("returns the passport's first config without merging template", async () => {
      const template = makeTemplate();
      await service.create(templateHolder(template), { label: "TemplateOnly" });
      await service.applyPatch(
        templateHolder(template),
        (await service.list(templateHolder(template)))[0].id,
        { elementDesign: { "submodel.foo": PresentationComponentName.BigNumber } },
      );

      const passport = makePassport({ templateId: template.id });
      const list = await service.list(passportHolder(passport));
      expect(list[0].elementDesign.size).toBe(0);

      const effective = await service.getEffective(passportHolder(passport));
      expect(effective.id).toBe(list[0].id);
      expect(effective.elementDesign.size).toBe(0);
    });
  });

  describe("getEffective (template)", () => {
    it("returns the template's first config (lazy-creating a default when empty)", async () => {
      const template = makeTemplate();
      const effective = await service.getEffective(templateHolder(template));
      expect(effective.label).toBeNull();
      expect(effective.referenceId).toBe(template.id);
      expect(effective.referenceType).toBe("template");

      const list = await service.list(templateHolder(template));
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(effective.id);
    });
  });

  describe("applyPatch (passport)", () => {
    it("persists a patch that adds an elementDesign entry", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      const result = await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });

      expect(Object.fromEntries(result.elementDesign)).toEqual({
        "submodel-1.prop": PresentationComponentName.BigNumber,
      });
    });

    it("is a no-op when the patch makes no observable change", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      const result = await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: {},
      });

      expect(Object.fromEntries(result.elementDesign)).toEqual({});
    });

    it("merges defaultComponents and elementDesign across multiple patches", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      const [refreshed] = await service.list(passportHolder(passport));
      const second = await service.applyPatch(passportHolder(passport), refreshed.id, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });

      expect(Object.fromEntries(second.defaultComponents)).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
      expect(Object.fromEntries(second.elementDesign)).toEqual({
        "submodel-1.prop": PresentationComponentName.BigNumber,
      });
    });

    it("removes a key when the patch value is null", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });
      const [refreshed] = await service.list(passportHolder(passport));
      const cleared = await service.applyPatch(passportHolder(passport), refreshed.id, {
        elementDesign: { "submodel-1.prop": null },
      });

      expect(Object.fromEntries(cleared.elementDesign)).toEqual({});
    });
  });

  describe("applyPatch (template)", () => {
    it("persists a patch for a template config", async () => {
      const template = makeTemplate();
      const [defaultConfig] = await service.list(templateHolder(template));

      const result = await service.applyPatch(templateHolder(template), defaultConfig.id, {
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });

      expect(Object.fromEntries(result.defaultComponents)).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
    });
  });

  describe("requireOwned — cross-type isolation", () => {
    it("rejects getById when referenceType differs (passport vs template share same id)", async () => {
      const passport = makePassport();
      const template = makeTemplate();
      // Create a config for the passport; then attempt to access it via the template holder.
      // Even though referenceIds may differ here, the check covers both keys.
      const created = await service.create(passportHolder(passport), { label: "p-only" });

      // Accessing the passport config via a template holder (even with the same referenceId
      // in theory) must fail because the referenceType key differs.
      const fakeTemplateHolder: PresentationReferenceHolder = {
        id: passport.id, // same UUID, different type
        organizationId: template.organizationId,
        referenceType: PresentationReferenceType.Template,
      };

      await expect(service.getById(fakeTemplateHolder, created.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe("snapshotTemplateConfigsToPassport", () => {
    it("copies template configs to the passport with the same elementDesign and label", async () => {
      const template = makeTemplate();
      const [defaultConfig] = await service.list(templateHolder(template));
      await service.applyPatch(templateHolder(template), defaultConfig.id, {
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });

      const passport = makePassport({ templateId: template.id });
      const snapshots = await service.snapshotTemplateConfigsToPassport(passport);

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].referenceId).toBe(passport.id);
      expect(snapshots[0].referenceType).toBe(PresentationReferenceType.Passport);
      expect(Object.fromEntries(snapshots[0].elementDesign)).toEqual({
        "sm.p": PresentationComponentName.BigNumber,
      });
    });

    it("returns empty array when passport has no templateId", async () => {
      const passport = makePassport();
      const snapshots = await service.snapshotTemplateConfigsToPassport(passport);
      expect(snapshots).toHaveLength(0);
    });
  });

  describe("element-level permission enforcement", () => {
    const memberSubject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const anonymousSubject = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    function buildAbilities() {
      const security = Security.create({});
      const readPerm = Permission.create({
        permission: Permissions.Read,
        kindOfPermission: PermissionKind.Allow,
      });
      const editPerm = Permission.create({
        permission: Permissions.Edit,
        kindOfPermission: PermissionKind.Allow,
      });
      security.addPolicy(memberSubject, IdShortPath.create({ path: "Pub" }), [readPerm, editPerm]);
      security.addPolicy(memberSubject, IdShortPath.create({ path: "Secret" }), [readPerm]);
      return {
        memberAbility: security.defineAbilityForSubject(memberSubject),
        anonymousAbility: security.defineAbilityForSubject(anonymousSubject),
      };
    }

    async function seedConfigWithEntries(
      passport: Passport,
      entries: Record<string, PresentationComponentName>,
    ) {
      const [defaultConfig] = await service.list(passportHolder(passport));
      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: entries,
      });
      return (await service.list(passportHolder(passport)))[0];
    }

    async function seedTemplateConfigWithEntries(
      template: Template,
      entries: Record<string, PresentationComponentName>,
    ) {
      const [defaultConfig] = await service.list(templateHolder(template));
      await service.applyPatch(templateHolder(template), defaultConfig.id, {
        elementDesign: entries,
      });
      return (await service.list(templateHolder(template)))[0];
    }

    it("getEffective (passport) strips elementDesign entries the subject can't read", async () => {
      const { memberAbility } = buildAbilities();
      const passport = makePassport();
      await seedConfigWithEntries(passport, {
        Pub: PresentationComponentName.BigNumber,
        Secret: PresentationComponentName.BigNumber,
      });

      const effective = await service.getEffective(passportHolder(passport), memberAbility);
      expect(Object.fromEntries(effective.elementDesign)).toEqual({
        Pub: PresentationComponentName.BigNumber,
        Secret: PresentationComponentName.BigNumber,
      });
    });

    it("getEffective (passport) hides every elementDesign entry for an anonymous subject without rules", async () => {
      const { anonymousAbility } = buildAbilities();
      const passport = makePassport();
      await seedConfigWithEntries(passport, {
        Pub: PresentationComponentName.BigNumber,
        Secret: PresentationComponentName.BigNumber,
      });

      const effective = await service.getEffective(passportHolder(passport), anonymousAbility);
      expect(effective.elementDesign.size).toBe(0);
    });

    it("getEffective (template) filters by readable paths", async () => {
      const { memberAbility, anonymousAbility } = buildAbilities();
      const template = makeTemplate();
      await seedTemplateConfigWithEntries(template, {
        Pub: PresentationComponentName.BigNumber,
        Secret: PresentationComponentName.BigNumber,
      });

      const memberView = await service.getEffective(templateHolder(template), memberAbility);
      expect(memberView.elementDesign.size).toBe(2);

      const anonymousView = await service.getEffective(templateHolder(template), anonymousAbility);
      expect(anonymousView.elementDesign.size).toBe(0);
    });

    it("getById (passport) applies the same read filter", async () => {
      const { anonymousAbility } = buildAbilities();
      const passport = makePassport();
      const seeded = await seedConfigWithEntries(passport, {
        Pub: PresentationComponentName.BigNumber,
      });

      const filtered = await service.getById(passportHolder(passport), seeded.id, anonymousAbility);
      expect(filtered.elementDesign.size).toBe(0);
    });

    it("list (passport) filters every config in the array", async () => {
      const { anonymousAbility } = buildAbilities();
      const passport = makePassport();
      await seedConfigWithEntries(passport, { Pub: PresentationComponentName.BigNumber });
      const variant = await service.create(passportHolder(passport), { label: "Variant A" });
      await service.applyPatch(passportHolder(passport), variant.id, {
        elementDesign: { Pub: PresentationComponentName.BigNumber },
      });

      const list = await service.list(passportHolder(passport), anonymousAbility);
      expect(list).toHaveLength(2);
      for (const config of list) {
        expect(config.elementDesign.size).toBe(0);
      }
    });

    it("applyPatch (passport) allows entries the subject can edit", async () => {
      const { memberAbility } = buildAbilities();
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      const result = await service.applyPatch(
        passportHolder(passport),
        defaultConfig.id,
        { elementDesign: { Pub: PresentationComponentName.BigNumber } },
        memberAbility,
      );

      expect(Object.fromEntries(result.elementDesign)).toEqual({
        Pub: PresentationComponentName.BigNumber,
      });
    });

    it("applyPatch (passport) rejects edits to read-only paths", async () => {
      const { memberAbility } = buildAbilities();
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      await expect(
        service.applyPatch(
          passportHolder(passport),
          defaultConfig.id,
          { elementDesign: { Secret: PresentationComponentName.BigNumber } },
          memberAbility,
        ),
      ).rejects.toThrow(ForbiddenError);

      const [persisted] = await service.list(passportHolder(passport));
      expect(persisted.elementDesign.size).toBe(0);
    });

    it("applyPatch (passport) rejects atomically when any path is denied", async () => {
      const { memberAbility } = buildAbilities();
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      await expect(
        service.applyPatch(
          passportHolder(passport),
          defaultConfig.id,
          {
            elementDesign: {
              Pub: PresentationComponentName.BigNumber,
              Secret: PresentationComponentName.BigNumber,
            },
          },
          memberAbility,
        ),
      ).rejects.toThrow(ForbiddenError);

      const [persisted] = await service.list(passportHolder(passport));
      expect(persisted.elementDesign.size).toBe(0);
    });

    it("applyPatch (passport) allows defaultComponents-only patches without per-path checks", async () => {
      const { memberAbility } = buildAbilities();
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));

      const result = await service.applyPatch(
        passportHolder(passport),
        defaultConfig.id,
        {
          defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
        },
        memberAbility,
      );

      expect(Object.fromEntries(result.defaultComponents)).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
    });

    it("applyPatch (template) enforces the same write rules", async () => {
      const { memberAbility } = buildAbilities();
      const template = makeTemplate();
      const [defaultConfig] = await service.list(templateHolder(template));

      await expect(
        service.applyPatch(
          templateHolder(template),
          defaultConfig.id,
          { elementDesign: { Secret: PresentationComponentName.BigNumber } },
          memberAbility,
        ),
      ).rejects.toThrow(ForbiddenError);

      const allowed = await service.applyPatch(
        templateHolder(template),
        defaultConfig.id,
        { elementDesign: { Pub: PresentationComponentName.BigNumber } },
        memberAbility,
      );
      expect(Object.fromEntries(allowed.elementDesign)).toEqual({
        Pub: PresentationComponentName.BigNumber,
      });
    });
  });

  describe("removeElementDesignEntriesForPath", () => {
    it("removes an exact-match path from all configs for a passport", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));
      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: {
          "Submodel1.Prop": PresentationComponentName.BigNumber,
          "Submodel1.Other": PresentationComponentName.BigNumber,
          "Submodel2.Prop": PresentationComponentName.BigNumber,
        },
      });

      await service.removeElementDesignEntriesForPath(
        PresentationReferenceType.Passport,
        passport.id,
        "Submodel1.Prop",
      );

      const [after] = await service.list(passportHolder(passport));
      expect(Object.fromEntries(after.elementDesign)).toEqual({
        "Submodel1.Other": PresentationComponentName.BigNumber,
        "Submodel2.Prop": PresentationComponentName.BigNumber,
      });
    });

    it("removes all child paths when a parent path is deleted", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));
      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: {
          "Submodel1.Collection.Child1": PresentationComponentName.BigNumber,
          "Submodel1.Collection.Child2": PresentationComponentName.BigNumber,
          "Submodel1.Other": PresentationComponentName.BigNumber,
          "Submodel2.Prop": PresentationComponentName.BigNumber,
        },
      });

      await service.removeElementDesignEntriesForPath(
        PresentationReferenceType.Passport,
        passport.id,
        "Submodel1.Collection",
      );

      const [after] = await service.list(passportHolder(passport));
      expect(Object.fromEntries(after.elementDesign)).toEqual({
        "Submodel1.Other": PresentationComponentName.BigNumber,
        "Submodel2.Prop": PresentationComponentName.BigNumber,
      });
    });

    it("removes paths across multiple configs for the same reference", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));
      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: { "Submodel1.Prop": PresentationComponentName.BigNumber },
      });
      const variant = await service.create(passportHolder(passport), { label: "Variant B" });
      await service.applyPatch(passportHolder(passport), variant.id, {
        elementDesign: {
          "Submodel1.Prop": PresentationComponentName.BigNumber,
          "Submodel1.Other": PresentationComponentName.BigNumber,
        },
      });

      await service.removeElementDesignEntriesForPath(
        PresentationReferenceType.Passport,
        passport.id,
        "Submodel1.Prop",
      );

      const configs = await service.list(passportHolder(passport));
      for (const config of configs) {
        expect(config.elementDesign.has("Submodel1.Prop")).toBe(false);
      }
      const variantAfter = configs.find((c) => c.id === variant.id)!;
      expect(variantAfter.elementDesign.has("Submodel1.Other")).toBe(true);
    });

    it("removes paths for a template reference type", async () => {
      const template = makeTemplate();
      const [defaultConfig] = await service.list(templateHolder(template));
      await service.applyPatch(templateHolder(template), defaultConfig.id, {
        elementDesign: {
          "Sm.Prop": PresentationComponentName.BigNumber,
          "Sm.Prop.Child": PresentationComponentName.BigNumber,
        },
      });

      await service.removeElementDesignEntriesForPath(
        PresentationReferenceType.Template,
        template.id,
        "Sm.Prop",
      );

      const [after] = await service.list(templateHolder(template));
      expect(after.elementDesign.size).toBe(0);
    });

    it("is a no-op when no config has the matching path", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.list(passportHolder(passport));
      await service.applyPatch(passportHolder(passport), defaultConfig.id, {
        elementDesign: { "Submodel1.Prop": PresentationComponentName.BigNumber },
      });

      await expect(
        service.removeElementDesignEntriesForPath(
          PresentationReferenceType.Passport,
          passport.id,
          "Submodel2.NonExistent",
        ),
      ).resolves.not.toThrow();

      const [after] = await service.list(passportHolder(passport));
      expect(after.elementDesign.has("Submodel1.Prop")).toBe(true);
    });
  });
});
