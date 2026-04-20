import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { PermissionKind, Permissions } from "@open-dpp/dto";

import { EnvModule, EnvService } from "@open-dpp/env";
import { allPermissionsAllow } from "@open-dpp/testing";
import { generateMongoConfig } from "../../../database/config";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../../identity/users/users.module";
import { Media } from "../../../media/domain/media";
import { MediaService } from "../../../media/infrastructure/media.service";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../../passports/infrastructure/passport.schema";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { Template } from "../../../templates/domain/template";
import { TemplateRepository } from "../../../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../../../templates/infrastructure/template.schema";
import { IdShortPath } from "../../domain/common/id-short-path";
import { Environment } from "../../domain/environment";
import { createAasObject } from "../../domain/security/aas-object";
import { AccessPermissionRule } from "../../domain/security/access-permission-rule";
import { Permission } from "../../domain/security/permission";
import { PermissionPerObject } from "../../domain/security/permission-per-object";
import { SubjectAttributes } from "../../domain/security/subject-attributes";
import { registerSubmodelElementClasses } from "../../domain/submodel-base/register-submodel-element-classes";
import { EnvironmentService } from "../../presentation/environment.service";
import { BadRequestException, Logger } from "@nestjs/common";
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
import { AasExportVersion, AasExportVersionType } from "./export-schemas/aas-export-shared";

const adminPlain = {
  subjectAttribute: [
    {
      category: null,
      description: [],
      displayName: [],
      embeddedDataSpecifications: [],
      extensions: [],
      idShort: "userRole",
      modelType: "Property",
      qualifiers: [],
      semanticId: null,
      supplementalSemanticIds: [],
      value: UserRole.ADMIN,
      valueId: null,
      valueType: "String",
    },
  ],
};

const memberPlain = {
  subjectAttribute: [
    {
      category: null,
      description: [],
      displayName: [],
      embeddedDataSpecifications: [],
      extensions: [],
      idShort: "userRole",
      modelType: "Property",
      qualifiers: [],
      semanticId: null,
      supplementalSemanticIds: [],
      value: UserRole.USER,
      valueId: null,
      valueType: "String",
    },
    {
      category: null,
      description: [],
      displayName: [],
      embeddedDataSpecifications: [],
      extensions: [],
      idShort: "memberRole",
      modelType: "Property",
      qualifiers: [],
      semanticId: null,
      supplementalSemanticIds: [],
      value: MemberRole.MEMBER,
      valueId: null,
      valueType: "String",
    },
  ],
};

const submodel1SecReference = {
  category: null,
  description: [],
  displayName: [],
  embeddedDataSpecifications: [],
  extensions: [],
  idShort: "submodel-1",
  modelType: "ReferenceElement",
  qualifiers: [],
  semanticId: null,
  supplementalSemanticIds: [],
  value: null,
};

const submodel2SecReference = {
  category: null,
  description: [],
  displayName: [],
  embeddedDataSpecifications: [],
  extensions: [],
  idShort: "submodel-2",
  modelType: "ReferenceElement",
  qualifiers: [],
  semanticId: null,
  supplementalSemanticIds: [],
  value: null,
};

const securityForV2_0 = {
  localAccessControl: {
    accessPermissionRules: [
      {
        targetSubjectAttributes: adminPlain,
        permissionsPerObject: [
          {
            object: submodel1SecReference,
            permissions: [
              {
                kindOfPermission: "Allow",
                permission: "Read",
              },
            ],
          },
          {
            object: submodel2SecReference,
            permissions: [
              {
                kindOfPermission: "Allow",
                permission: "Read",
              },
            ],
          },
        ],
      },
      {
        targetSubjectAttributes: memberPlain,
        permissionsPerObject: [
          {
            object: submodel2SecReference,
            permissions: [
              {
                kindOfPermission: "Allow",
                permission: "Read",
              },
            ],
          },
        ],
      },
    ],
  },
};

function buildExportData(
  overrides: {
    defaultThumbnails?: Array<{ path: string; contentType: string | null }>;
    submodelElements?: any[];
    version?: AasExportVersionType;
  } = {},
) {
  const version = overrides.version ?? AasExportVersion.v2_0;
  const security = overrides.version !== AasExportVersion.v1_0 ? securityForV2_0 : undefined;
  return {
    id: randomUUID(),
    format: "open-dpp:json",
    version,
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
          security,
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
        {
          id: randomUUID(),
          extensions: [],
          category: null,
          idShort: "submodel-2",
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
  let mockMediaService: { findByIds: jest.Mock<any> };
  let environmentService: EnvironmentService;

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
          {
            name: PresentationConfigurationDoc.name,
            schema: PresentationConfigurationSchema,
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
        PresentationConfigurationRepository,
        PresentationConfigurationService,
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    }).compile();

    aasSerializationService = module.get<AasSerializationService>(AasSerializationService);
    passportRepository = module.get<PassportRepository>(PassportRepository);
    templateRepository = module.get<TemplateRepository>(TemplateRepository);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
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
    const subject = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const exportResult = await aasSerializationService.exportPassport(foundAas, subject);
    expect(exportResult).toBeDefined();
    expect(exportResult.format).toBe("open-dpp:json");
    expect(exportResult.version).toBe(AasExportVersion.v3_0);
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
      const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
      const exported = await aasSerializationService.exportPassport(loaded, admin);
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
      const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });

      const exported = await aasSerializationService.exportPassport(loaded, admin);
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
      const data: any = buildExportData();
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
      expect(importedSubmodelIds).toHaveLength(2);
      expect(importedSubmodelIds[0]).not.toBe(originalSubmodelId);
    });

    it("should remap shell submodel references to the new submodel IDs", async () => {
      const originalSubmodelId = randomUUID();
      const data: any = buildExportData();
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
      const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });

      const exported = await aasSerializationService.exportPassport(loaded, admin);

      expect(exported.environment.assetAdministrationShells[0].security).toEqual(securityForV2_0);

      const exportedSubmodelId = exported.environment.submodels[0].id;
      expect(exportedSubmodelId).not.toBe(originalSubmodelId);

      const shellSubmodelRef = exported.environment.assetAdministrationShells[0].submodels[0];
      expect(shellSubmodelRef.keys[0].value).toBe(exportedSubmodelId);

      const member = SubjectAttributes.create({
        userRole: UserRole.USER,
        memberRole: MemberRole.MEMBER,
      });

      const exportedForMember = await aasSerializationService.exportPassport(loaded, member);
      expect(exportedForMember.environment.assetAdministrationShells[0].security).toEqual({
        localAccessControl: {
          accessPermissionRules: [
            {
              targetSubjectAttributes: adminPlain,
              permissionsPerObject: [
                {
                  object: submodel2SecReference,
                  permissions: [
                    {
                      kindOfPermission: "Allow",
                      permission: "Read",
                    },
                  ],
                },
              ],
            },
            {
              targetSubjectAttributes: memberPlain,
              permissionsPerObject: [
                {
                  object: submodel2SecReference,
                  permissions: [
                    {
                      kindOfPermission: "Allow",
                      permission: "Read",
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
      expect(exportedForMember.environment.submodels).toEqual([
        {
          administration: null,
          category: null,
          description: [],
          displayName: [],
          embeddedDataSpecifications: [],
          extensions: [],
          id: expect.any(String),
          idShort: "submodel-2",
          kind: null,
          qualifiers: [],
          semanticId: null,
          submodelElements: [],
          supplementalSemanticIds: [],
        },
      ]);
    });

    it("should import passport of version 1.0", async () => {
      const originalSubmodelId = randomUUID();
      const data: any = buildExportData({ version: AasExportVersion.v1_0 });
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

      const expandedEnv = await environmentService.loadExpandedEnvironment(passport.environment);
      const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

      const readPermission = [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      ];
      expect(
        expandedEnv.shells[0].security.localAccessControl.findRuleOfSubject(anonymous),
      ).toEqual(
        AccessPermissionRule.create({
          targetSubjectAttributes: anonymous,
          permissionsPerObject: [
            PermissionPerObject.create({
              object: createAasObject(
                IdShortPath.create({ path: expandedEnv.submodels[0].idShort }),
              ),
              permissions: readPermission,
            }),
            PermissionPerObject.create({
              object: createAasObject(
                IdShortPath.create({ path: expandedEnv.submodels[1].idShort }),
              ),
              permissions: readPermission,
            }),
          ],
        }),
      );

      const member = SubjectAttributes.create({
        userRole: UserRole.USER,
        memberRole: MemberRole.MEMBER,
      });

      expect(expandedEnv.shells[0].security.localAccessControl.findRuleOfSubject(member)).toEqual(
        AccessPermissionRule.create({
          targetSubjectAttributes: member,
          permissionsPerObject: [
            PermissionPerObject.create({
              object: createAasObject(
                IdShortPath.create({ path: expandedEnv.submodels[0].idShort }),
              ),
              permissions: allPermissionsAllow.map(Permission.fromPlain),
            }),
            PermissionPerObject.create({
              object: createAasObject(
                IdShortPath.create({ path: expandedEnv.submodels[1].idShort }),
              ),
              permissions: allPermissionsAllow.map(Permission.fromPlain),
            }),
          ],
        }),
      );

      expect(expandedEnv.submodels[0].id).not.toEqual(originalSubmodelId);
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

    it("should nullify thumbnail when media belongs to a different organization or does not exist", async () => {
      const mediaId = randomUUID();
      const data = buildExportData({
        defaultThumbnails: [
          { path: mediaId, contentType: "image/webp" },
          { path: "non-existing-media", contentType: "image/webp" },
        ],
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
      const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });

      const exported = await aasSerializationService.exportTemplate(loaded, admin);
      expect(
        exported.environment.assetAdministrationShells[0].assetInformation.defaultThumbnails,
      ).toEqual([]);
    });
  });

  describe("presentation configuration", () => {
    const orgId = "org-1";

    it("lazily creates a PresentationConfiguration when exporting a passport", async () => {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      await passportRepository.save(passport);

      const presentationConfigurationRepository = module.get<PresentationConfigurationRepository>(
        PresentationConfigurationRepository,
      );
      expect(
        await presentationConfigurationRepository.findByReference({
          referenceType: "passport",
          referenceId: passport.id,
        }),
      ).toBeUndefined();

      const subject = SubjectAttributes.create({ userRole: UserRole.ADMIN });
      const exportResult = await aasSerializationService.exportPassport(passport, subject);

      expect(exportResult.version).toBe(AasExportVersion.v3_0);
      expect(
        await presentationConfigurationRepository.findByReference({
          referenceType: "passport",
          referenceId: passport.id,
        }),
      ).toBeDefined();
    });

    it("round-trips the PresentationConfiguration through v3 export/import", async () => {
      const data = buildExportData({ version: AasExportVersion.v3_0 });
      (data as any).presentationConfiguration = {
        elementDesign: { "submodel-1.prop-1": "BigNumber" },
        defaultComponents: { Property: "BigNumber", File: "BigNumber" },
      };

      const imported = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      const presentationConfigurationRepository = module.get<PresentationConfigurationRepository>(
        PresentationConfigurationRepository,
      );
      const stored = await presentationConfigurationRepository.findByReference({
        referenceType: "passport",
        referenceId: imported.id,
      });
      expect(stored).toBeDefined();
      expect(Object.fromEntries(stored!.elementDesign)).toEqual({
        "submodel-1.prop-1": "BigNumber",
      });
      expect(Object.fromEntries(stored!.defaultComponents)).toEqual({
        Property: "BigNumber",
        File: "BigNumber",
      });

      const loadedPassport = await passportRepository.findOneOrFail(imported.id);
      const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
      const reExported = await aasSerializationService.exportPassport(loadedPassport, admin);
      expect(reExported.presentationConfiguration).toEqual({
        elementDesign: { "submodel-1.prop-1": "BigNumber" },
        defaultComponents: { Property: "BigNumber", File: "BigNumber" },
      });
    });

    it("omits presentationConfiguration on v1/v2 import and lazily creates an empty one", async () => {
      const data = buildExportData({ version: AasExportVersion.v2_0 });

      const imported = await aasSerializationService.importPassport(
        data,
        orgId,
        async (p, options) => {
          await passportRepository.save(p, options);
        },
      );

      const presentationConfigurationRepository = module.get<PresentationConfigurationRepository>(
        PresentationConfigurationRepository,
      );
      expect(
        await presentationConfigurationRepository.findByReference({
          referenceType: "passport",
          referenceId: imported.id,
        }),
      ).toBeUndefined();

      const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
      await aasSerializationService.exportPassport(imported, admin);

      const now = await presentationConfigurationRepository.findByReference({
        referenceType: "passport",
        referenceId: imported.id,
      });
      expect(now).toBeDefined();
      expect(Object.fromEntries(now!.elementDesign)).toEqual({});
      expect(Object.fromEntries(now!.defaultComponents)).toEqual({});
    });

    it("rolls back the whole import when the PresentationConfiguration save fails", async () => {
      const data = buildExportData({ version: AasExportVersion.v3_0 });
      (data as any).presentationConfiguration = {
        elementDesign: { "submodel-1.prop-1": "BigNumber" },
        defaultComponents: { Property: "BigNumber" },
      };

      const presentationConfigurationRepository = module.get<PresentationConfigurationRepository>(
        PresentationConfigurationRepository,
      );
      const aasRepository = module.get<AasRepository>(AasRepository);
      const submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);

      const saveSpy = jest
        .spyOn(presentationConfigurationRepository, "save")
        .mockRejectedValueOnce(new Error("boom"));
      const serviceLogger = (aasSerializationService as unknown as { logger: Logger }).logger;
      const logSpy = jest.spyOn(serviceLogger, "error").mockImplementation(() => {});

      let capturedPassport: Passport | undefined;
      try {
        await expect(
          aasSerializationService.importPassport(data, orgId, async (p, options) => {
            capturedPassport = p;
            await passportRepository.save(p, options);
          }),
        ).rejects.toThrow("boom");

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(orgId), expect.anything());
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("passport"), expect.anything());
      } finally {
        saveSpy.mockRestore();
        logSpy.mockRestore();
      }

      expect(capturedPassport).toBeDefined();
      expect(await passportRepository.findOne(capturedPassport!.id)).toBeUndefined();
      expect(
        await presentationConfigurationRepository.findByReference({
          referenceType: "passport",
          referenceId: capturedPassport!.id,
        }),
      ).toBeUndefined();
      for (const shellId of capturedPassport!.environment!.assetAdministrationShells) {
        expect(await aasRepository.findOne(shellId)).toBeUndefined();
      }
      for (const submodelId of capturedPassport!.environment!.submodels) {
        expect(await submodelRepository.findOne(submodelId)).toBeUndefined();
      }
    });

    it("rolls back the whole importTemplate when the PresentationConfiguration save fails", async () => {
      const data = buildExportData({ version: AasExportVersion.v3_0 });
      (data as any).presentationConfiguration = {
        elementDesign: { "submodel-1.prop-1": "BigNumber" },
        defaultComponents: { Property: "BigNumber" },
      };

      const presentationConfigurationRepository = module.get<PresentationConfigurationRepository>(
        PresentationConfigurationRepository,
      );
      const aasRepository = module.get<AasRepository>(AasRepository);
      const submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);

      const saveSpy = jest
        .spyOn(presentationConfigurationRepository, "save")
        .mockRejectedValueOnce(new Error("boom"));
      const serviceLogger = (aasSerializationService as unknown as { logger: Logger }).logger;
      const logSpy = jest.spyOn(serviceLogger, "error").mockImplementation(() => {});

      let capturedTemplate: Template | undefined;
      try {
        await expect(
          aasSerializationService.importTemplate(data, orgId, async (t, options) => {
            capturedTemplate = t;
            await templateRepository.save(t, options);
          }),
        ).rejects.toThrow("boom");

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(orgId), expect.anything());
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("template"), expect.anything());
      } finally {
        saveSpy.mockRestore();
        logSpy.mockRestore();
      }

      expect(capturedTemplate).toBeDefined();
      expect(await templateRepository.findOne(capturedTemplate!.id)).toBeUndefined();
      expect(
        await presentationConfigurationRepository.findByReference({
          referenceType: "template",
          referenceId: capturedTemplate!.id,
        }),
      ).toBeUndefined();
      for (const shellId of capturedTemplate!.environment!.assetAdministrationShells) {
        expect(await aasRepository.findOne(shellId)).toBeUndefined();
      }
      for (const submodelId of capturedTemplate!.environment!.submodels) {
        expect(await submodelRepository.findOne(submodelId)).toBeUndefined();
      }
    });

    it("rejects a malformed v3 presentationConfiguration with a precise validation path", async () => {
      const data = buildExportData({ version: AasExportVersion.v3_0 });
      (data as any).presentationConfiguration = {
        elementDesign: 42,
        defaultComponents: { Property: "BigNumber" },
      };

      let capturedPassport: Passport | undefined;
      let capturedError: unknown;
      try {
        await aasSerializationService.importPassport(data, orgId, async (p, options) => {
          capturedPassport = p;
          await passportRepository.save(p, options);
        });
      } catch (error) {
        capturedError = error;
      }

      expect(capturedError).toBeInstanceOf(BadRequestException);
      const message = (capturedError as BadRequestException).message;
      expect(message).toContain("Invalid import data format:");
      expect(message).toContain("presentationConfiguration.elementDesign");
      expect(capturedPassport).toBeUndefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
