import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Connection } from "mongoose";

import { Environment } from "../../../aas/domain/environment";
import { generateMongoConfig } from "../../../database/config";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../infrastructure/presentation-configuration.schema";
import { PresentationConfigurationService } from "./presentation-configuration.service";

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

  describe("listForPassport", () => {
    it("lazy-creates a default config when none exist", async () => {
      const passport = makePassport();
      const list = await service.listForPassport(passport);
      expect(list).toHaveLength(1);
      expect(list[0].label).toBeNull();

      // Subsequent call returns the persisted one (no duplicates)
      const again = await service.listForPassport(passport);
      expect(again).toHaveLength(1);
      expect(again[0].id).toBe(list[0].id);
    });

    it("returns existing configs sorted by createdAt", async () => {
      const passport = makePassport();
      await service.listForPassport(passport); // seed default
      await service.createForPassport(passport, { label: "Variant A" });
      const list = await service.listForPassport(passport);
      expect(list).toHaveLength(2);
      expect(list[0].label).toBeNull();
      expect(list[1].label).toBe("Variant A");
    });
  });

  describe("createForPassport", () => {
    it("creates a new config with the given label", async () => {
      const passport = makePassport();
      const created = await service.createForPassport(passport, { label: "v1" });
      expect(created.label).toBe("v1");
      expect(created.referenceId).toBe(passport.id);
      expect(created.referenceType).toBe("passport");
    });
  });

  describe("deleteByConfigIdForPassport", () => {
    it("removes a config by id", async () => {
      const passport = makePassport();
      const created = await service.createForPassport(passport, { label: "v1" });
      await service.deleteByConfigIdForPassport(passport, created.id);
      const list = await service.listForPassport(passport);
      expect(list.find((c) => c.id === created.id)).toBeUndefined();
    });
  });

  describe("getEffectiveForPassport (no merge)", () => {
    it("returns the passport's first config without merging template", async () => {
      const template = makeTemplate();
      await service.createForTemplate(template, { label: "TemplateOnly" });
      await service.applyPatchByConfigIdForTemplate(
        template,
        (await service.listForTemplate(template))[0].id,
        { elementDesign: { "submodel.foo": PresentationComponentName.BigNumber } },
      );

      const passport = makePassport({ templateId: template.id });
      const list = await service.listForPassport(passport); // lazy-creates default
      expect(list[0].elementDesign.size).toBe(0);

      const effective = await service.getEffectiveForPassport(passport);
      expect(effective.id).toBe(list[0].id);
      expect(effective.elementDesign.size).toBe(0); // NO template merge
    });
  });

  describe("applyPatchByConfigIdForPassport", () => {
    it("persists a patch that adds an elementDesign entry", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.listForPassport(passport);

      const result = await service.applyPatchByConfigIdForPassport(passport, defaultConfig.id, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });

      expect(Object.fromEntries(result.elementDesign)).toEqual({
        "submodel-1.prop": PresentationComponentName.BigNumber,
      });
    });

    it("is a no-op when the patch makes no observable change", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.listForPassport(passport);

      const result = await service.applyPatchByConfigIdForPassport(passport, defaultConfig.id, {
        elementDesign: {},
      });

      expect(Object.fromEntries(result.elementDesign)).toEqual({});
    });

    it("merges defaultComponents and elementDesign across multiple patches", async () => {
      const passport = makePassport();
      const [defaultConfig] = await service.listForPassport(passport);

      await service.applyPatchByConfigIdForPassport(passport, defaultConfig.id, {
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      const [refreshed] = await service.listForPassport(passport);
      const second = await service.applyPatchByConfigIdForPassport(passport, refreshed.id, {
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
      const [defaultConfig] = await service.listForPassport(passport);

      await service.applyPatchByConfigIdForPassport(passport, defaultConfig.id, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });
      const [refreshed] = await service.listForPassport(passport);
      const cleared = await service.applyPatchByConfigIdForPassport(passport, refreshed.id, {
        elementDesign: { "submodel-1.prop": null },
      });

      expect(Object.fromEntries(cleared.elementDesign)).toEqual({});
    });
  });

  describe("applyPatchByConfigIdForTemplate", () => {
    it("persists a patch for a template config", async () => {
      const template = makeTemplate();
      const [defaultConfig] = await service.listForTemplate(template);

      const result = await service.applyPatchByConfigIdForTemplate(template, defaultConfig.id, {
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });

      expect(Object.fromEntries(result.defaultComponents)).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
    });
  });

  describe("snapshotTemplateConfigsToPassport", () => {
    it("copies template configs to the passport with the same elementDesign and label", async () => {
      const template = makeTemplate();
      const [defaultConfig] = await service.listForTemplate(template);
      await service.applyPatchByConfigIdForTemplate(template, defaultConfig.id, {
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
});
