import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import type { Connection } from "mongoose";

import { Environment } from "../../../aas/domain/environment";
import { generateMongoConfig } from "../../../database/config";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../infrastructure/presentation-configuration.schema";
import { PresentationConfigurationService } from "./presentation-configuration.service";

describe("PresentationConfigurationService", () => {
  let service: PresentationConfigurationService;
  let repository: PresentationConfigurationRepository;
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
    repository = module.get(PresentationConfigurationRepository);
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

  describe("findOrInstantiateForPassport", () => {
    it("returns an in-memory default when no row exists, without writing", async () => {
      const passport = makePassport();

      const config = await service.findOrInstantiateForPassport(passport);

      expect(config.referenceId).toBe(passport.id);
      expect(config.referenceType).toBe(PresentationReferenceType.Passport);
      expect(Object.fromEntries(config.elementDesign)).toEqual({});

      expect(
        await repository.findByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        }),
      ).toBeUndefined();
    });

    it("returns the persisted row when one exists", async () => {
      const passport = makePassport();
      const persisted = await repository.save(
        PresentationConfiguration.create({
          organizationId: passport.organizationId,
          referenceId: passport.id,
          referenceType: PresentationReferenceType.Passport,
          elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
        }),
      );

      const config = await service.findOrInstantiateForPassport(passport);

      expect(config.id).toBe(persisted.id);
      expect(Object.fromEntries(config.elementDesign)).toEqual({
        "submodel-1.prop": PresentationComponentName.BigNumber,
      });
    });
  });

  describe("findOrInstantiateForTemplate", () => {
    it("returns an in-memory default when no row exists, without writing", async () => {
      const template = makeTemplate();

      const config = await service.findOrInstantiateForTemplate(template);

      expect(config.referenceId).toBe(template.id);
      expect(config.referenceType).toBe(PresentationReferenceType.Template);

      expect(
        await repository.findByReference({
          referenceType: PresentationReferenceType.Template,
          referenceId: template.id,
        }),
      ).toBeUndefined();
    });
  });

  describe("applyPatchForPassport", () => {
    it("persists a row on first PATCH that adds an elementDesign entry", async () => {
      const passport = makePassport();

      const result = await service.applyPatchForPassport(passport, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });

      expect(Object.fromEntries(result.elementDesign)).toEqual({
        "submodel-1.prop": PresentationComponentName.BigNumber,
      });

      const persisted = await repository.findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      });
      expect(persisted?.id).toBe(result.id);
    });

    it("is a no-op when the patch makes no observable change", async () => {
      const passport = makePassport();

      const result = await service.applyPatchForPassport(passport, { elementDesign: {} });

      expect(Object.fromEntries(result.elementDesign)).toEqual({});

      // No row should be persisted on a no-op patch.
      expect(
        await repository.findByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        }),
      ).toBeUndefined();
    });

    it("merges defaultComponents and elementDesign across multiple patches", async () => {
      const passport = makePassport();

      await service.applyPatchForPassport(passport, {
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      const second = await service.applyPatchForPassport(passport, {
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
      await service.applyPatchForPassport(passport, {
        elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
      });

      const cleared = await service.applyPatchForPassport(passport, {
        elementDesign: { "submodel-1.prop": null },
      });

      expect(Object.fromEntries(cleared.elementDesign)).toEqual({});
    });

    it("translates a duplicate-key race into ValueError", async () => {
      const passport = makePassport();

      // Simulate the race window: another caller already inserted a row for
      // (Passport, passport.id) between our findByReference and our save.
      // Pre-create the row, then make findByReference return undefined so
      // the service builds a *new* in-memory instance with a fresh id and
      // tries to save — the unique index on (referenceType, referenceId)
      // surfaces E11000, which the service translates to ValueError.
      await repository.save(
        PresentationConfiguration.create({
          organizationId: passport.organizationId,
          referenceId: passport.id,
          referenceType: PresentationReferenceType.Passport,
        }),
      );
      const findSpy = jest.spyOn(repository, "findByReference").mockResolvedValueOnce(undefined);

      try {
        await expect(
          service.applyPatchForPassport(passport, {
            elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
          }),
        ).rejects.toBeInstanceOf(ValueError);
      } finally {
        findSpy.mockRestore();
      }
    });
  });

  describe("applyPatchForTemplate", () => {
    it("persists a row on first PATCH", async () => {
      const template = makeTemplate();

      const result = await service.applyPatchForTemplate(template, {
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });

      const persisted = await repository.findByReference({
        referenceType: PresentationReferenceType.Template,
        referenceId: template.id,
      });
      expect(persisted?.id).toBe(result.id);
    });
  });

  describe("getEffectiveForPassport", () => {
    it("returns an empty in-memory config when neither passport nor template have rows", async () => {
      const passport = makePassport();

      const effective = await service.getEffectiveForPassport(passport);

      expect(Object.fromEntries(effective.elementDesign)).toEqual({});
      expect(Object.fromEntries(effective.defaultComponents)).toEqual({});
    });

    it("merges template defaults under passport-specific entries (passport wins)", async () => {
      const templateId = randomUUID();
      const passport = makePassport({ templateId });

      await repository.save(
        PresentationConfiguration.create({
          organizationId: passport.organizationId,
          referenceId: templateId,
          referenceType: PresentationReferenceType.Template,
          elementDesign: { "submodel-1.shared": PresentationComponentName.BigNumber },
          defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
        }),
      );
      await repository.save(
        PresentationConfiguration.create({
          organizationId: passport.organizationId,
          referenceId: passport.id,
          referenceType: PresentationReferenceType.Passport,
          elementDesign: { "submodel-1.shared": PresentationComponentName.BigNumber },
        }),
      );

      const effective = await service.getEffectiveForPassport(passport);

      expect(Object.fromEntries(effective.elementDesign)).toEqual({
        "submodel-1.shared": PresentationComponentName.BigNumber,
      });
      expect(Object.fromEntries(effective.defaultComponents)).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
    });

    it("returns the passport row alone when the passport has no templateId", async () => {
      const passport = makePassport();
      await repository.save(
        PresentationConfiguration.create({
          organizationId: passport.organizationId,
          referenceId: passport.id,
          referenceType: PresentationReferenceType.Passport,
          elementDesign: { "submodel-1.prop": PresentationComponentName.BigNumber },
        }),
      );

      const effective = await service.getEffectiveForPassport(passport);

      expect(Object.fromEntries(effective.elementDesign)).toEqual({
        "submodel-1.prop": PresentationComponentName.BigNumber,
      });
    });

    it("does not write a row for an uncustomized passport on read", async () => {
      const passport = makePassport();

      await service.getEffectiveForPassport(passport);
      await service.getEffectiveForPassport(passport);

      expect(
        await repository.findByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        }),
      ).toBeUndefined();
    });
  });
});
