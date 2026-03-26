import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../database/config";

import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UsersModule } from "../../../identity/users/users.module";
import { Media } from "../../../media/domain/media";
import { MediaService } from "../../../media/infrastructure/media.service";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../../passports/infrastructure/passport.schema";
import { TemplateRepository } from "../../../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../../../templates/infrastructure/template.schema";
import { Environment } from "../../domain/environment";
import { registerSubmodelElementClasses } from "../../domain/submodel-base/register-submodel-element-classes";
import { EnvironmentService } from "../../presentation/environment.service";
import { AasRepository } from "../aas.repository";
import { ConceptDescriptionRepository } from "../concept-description.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../schemas/asset-administration-shell.schema";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../schemas/concept-description.schema";
import { SubmodelDoc, SubmodelSchema } from "../schemas/submodel.schema";
import { SubmodelRepository } from "../submodel.repository";
import { AasSerializationService } from "./aas-serialization.service";

function buildExportData(
  overrides: {
    defaultThumbnails?: Array<{ path: string; contentType: string | null }>;
    submodelElements?: any[];
  } = {},
) {
  return {
    id: randomUUID(),
    format: "open-dpp:json",
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    environment: {
      assetAdministrationShells: [
        {
          id: randomUUID(),
          extensions: [],
          category: null,
          idShort: "shell-1",
          displayName: [],
          description: [],
          administration: null,
          embeddedDataSpecifications: [],
          derivedFrom: null,
          submodels: [],
          assetInformation: {
            assetKind: "Instance",
            globalAssetId: null,
            specificAssetIds: [],
            assetType: null,
            defaultThumbnails: overrides.defaultThumbnails ?? [],
          },
        },
      ],
      submodels: [
        {
          id: randomUUID(),
          extensions: [],
          category: null,
          idShort: "submodel-1",
          displayName: [],
          description: [],
          administration: null,
          kind: null,
          semanticId: null,
          supplementalSemanticIds: [],
          qualifiers: [],
          embeddedDataSpecifications: [],
          submodelElements: overrides.submodelElements ?? [],
        },
      ],
      conceptDescriptions: [],
    },
  };
}

function createMockMedia(id: string, organizationId: string): Media {
  return Media.loadFromDb({
    id,
    ownedByOrganizationId: organizationId,
    createdByUserId: "user-1",
    title: "test",
    description: "test",
    mimeType: "image/webp",
    fileExtension: "webp",
    size: 100,
    originalFilename: "test.webp",
    uniqueProductIdentifier: null,
    dataFieldId: null,
    bucket: "dpp",
    objectName: "test",
    eTag: "etag",
    versionId: "v1",
  });
}

describe("aasSerializationService", () => {
  let aasSerializationService: AasSerializationService;
  let passportRepository: PassportRepository;
  let templateRepository: TemplateRepository;
  let module: TestingModule;
  let mockMediaService: { findByIds: jest.Mock };

  beforeAll(async () => {
    registerSubmodelElementClasses();

    mockMediaService = {
      findByIds: jest.fn<any>().mockResolvedValue([]),
    };

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
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
          {
            name: ConceptDescriptionDoc.name,
            schema: ConceptDescriptionSchema,
          },
        ]),
        UsersModule,
        OrganizationsModule,
      ],
      providers: [
        EnvironmentService,
        PassportRepository,
        TemplateRepository,
        AasRepository,
        SubmodelRepository,
        AasSerializationService,
        ConceptDescriptionRepository,
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    }).compile();

    aasSerializationService = module.get<AasSerializationService>(AasSerializationService);
    passportRepository = module.get<PassportRepository>(PassportRepository);
    templateRepository = module.get<TemplateRepository>(TemplateRepository);
  });

  beforeEach(() => {
    mockMediaService.findByIds.mockReset();
    mockMediaService.findByIds.mockResolvedValue([]);
  });

  it("should export a passport", async () => {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await passportRepository.save(passport);
    const foundAas = await passportRepository.findOneOrFail(passport.id);
    const exportResult = await aasSerializationService.exportPassport(foundAas);
    expect(exportResult).toBeDefined();
    expect(exportResult.format).toBe("open-dpp:json");
    expect(exportResult.version).toBe("1.0");
  });

  describe("importPassport - media ownership validation", () => {
    const orgId = "org-1";

    it("should import passport when no media references exist", async () => {
      const data = buildExportData();

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      expect(passport).toBeDefined();
      expect(mockMediaService.findByIds).not.toHaveBeenCalled();
    });

    it("should import passport when all media belong to the same organization", async () => {
      const mediaId = randomUUID();
      const data = buildExportData({
        defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }],
      });

      mockMediaService.findByIds.mockResolvedValue([createMockMedia(mediaId, orgId)]);

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      expect(passport).toBeDefined();
      expect(mockMediaService.findByIds).toHaveBeenCalledWith([mediaId]);
    });

    it("should nullify thumbnail when media belongs to a different organization", async () => {
      const mediaId = randomUUID();
      const data = buildExportData({
        defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }],
      });

      mockMediaService.findByIds.mockResolvedValue([createMockMedia(mediaId, "other-org")]);

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      expect(passport).toBeDefined();
      const loaded = await passportRepository.findOneOrFail(passport!.id);
      const exported = await aasSerializationService.exportPassport(loaded);
      expect(
        exported.environment.assetAdministrationShells[0].assetInformation.defaultThumbnails,
      ).toEqual([]);
    });

    it("should allow import when media ID does not exist in database", async () => {
      const mediaId = randomUUID();
      const data = buildExportData({
        defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }],
      });

      mockMediaService.findByIds.mockResolvedValue([]);

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      expect(passport).toBeDefined();
    });

    it("should nullify File value when media belongs to a different organization", async () => {
      const fileMediaId = randomUUID();
      const data = buildExportData({
        submodelElements: [
          {
            modelType: "File",
            idShort: "productImage",
            contentType: "image/webp",
            value: fileMediaId,
            extensions: [],
            category: null,
            displayName: [],
            description: [],
            semanticId: null,
            supplementalSemanticIds: [],
            qualifiers: [],
            embeddedDataSpecifications: [],
          },
        ],
      });

      mockMediaService.findByIds.mockResolvedValue([createMockMedia(fileMediaId, "other-org")]);

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      expect(passport).toBeDefined();
      const loaded = await passportRepository.findOneOrFail(passport!.id);
      const exported = await aasSerializationService.exportPassport(loaded);
      const fileElement = exported.environment.submodels[0].submodelElements[0];
      expect(fileElement).toMatchObject({
        idShort: "productImage",
        value: null,
      });
    });
  });

  describe("importPassport - ID isolation", () => {
    const orgId = "org-1";

    it("should generate new submodel IDs so imported passport does not share submodels with the original", async () => {
      const originalSubmodelId = randomUUID();
      const data = buildExportData();
      data.environment.submodels[0].id = originalSubmodelId;
      data.environment.assetAdministrationShells[0].submodels = [
        {
          type: "ModelReference",
          keys: [{ type: "Submodel", value: originalSubmodelId }],
          referredSemanticId: null,
        },
      ];

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      const importedSubmodelIds = passport.environment.submodels;
      expect(importedSubmodelIds).toHaveLength(1);
      expect(importedSubmodelIds[0]).not.toBe(originalSubmodelId);
    });

    it("should remap shell submodel references to the new submodel IDs", async () => {
      const originalSubmodelId = randomUUID();
      const data = buildExportData();
      data.environment.submodels[0].id = originalSubmodelId;
      data.environment.assetAdministrationShells[0].submodels = [
        {
          type: "ModelReference",
          keys: [{ type: "Submodel", value: originalSubmodelId }],
          referredSemanticId: null,
        },
      ];

      const passport = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      const loaded = await passportRepository.findOneOrFail(passport.id);
      const exported = await aasSerializationService.exportPassport(loaded);

      const exportedSubmodelId = exported.environment.submodels[0].id;
      expect(exportedSubmodelId).not.toBe(originalSubmodelId);

      const shellSubmodelRef = exported.environment.assetAdministrationShells[0].submodels[0];
      expect(shellSubmodelRef.keys[0].value).toBe(exportedSubmodelId);
    });
  });

  describe("importTemplate - media ownership validation", () => {
    const orgId = "org-1";

    it("should import template when all media belong to the same organization", async () => {
      const mediaId = randomUUID();
      const data = buildExportData({
        defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }],
      });

      mockMediaService.findByIds.mockResolvedValue([createMockMedia(mediaId, orgId)]);

      const template = await aasSerializationService.importTemplate(
        data,
        orgId,
        async (t, options) => {
          await templateRepository.save(t, options);
        },
      );

      expect(template).toBeDefined();
    });

    it("should nullify thumbnail when media belongs to a different organization", async () => {
      const mediaId = randomUUID();
      const data = buildExportData({
        defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }],
      });

      mockMediaService.findByIds.mockResolvedValue([createMockMedia(mediaId, "other-org")]);

      const template = await aasSerializationService.importTemplate(
        data,
        orgId,
        async (t, options) => {
          await templateRepository.save(t, options);
        },
      );

      expect(template).toBeDefined();
      const loaded = await templateRepository.findOneOrFail(template.id);
      const exported = await aasSerializationService.exportTemplate(loaded);
      expect(
        exported.environment.assetAdministrationShells[0].assetInformation.defaultThumbnails,
      ).toEqual([]);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
