import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AssetKindType, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { AssetInformation } from "../../../aas/domain/asset-information";
import { Key } from "../../../aas/domain/common/key";
import { Reference } from "../../../aas/domain/common/reference";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Template } from "../../domain/template";
import { TemplateRepository } from "../../infrastructure/template.repository";
import { TemplateService } from "./template.service";

describe("templateService", () => {
  let service: TemplateService;

  const mockTemplateRepository = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn<() => Promise<Template>>(),
    save: jest.fn(),
  };

  const mockEnvironmentService = {
    loadExpandedEnvironment: jest.fn<() => Promise<ExpandedEnvironment>>(),
    persistImportedEnvironment: jest.fn<(
      shells: AssetAdministrationShell[],
      submodels: Submodel[],
      saveEntity: (options: any) => Promise<void>,
    ) => Promise<void>>().mockImplementation(async (_shells, _submodels, saveEntity) => {
      await saveEntity({});
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: TemplateRepository,
          useValue: mockTemplateRepository,
        },
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService,
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    jest.clearAllMocks();

    mockEnvironmentService.persistImportedEnvironment.mockImplementation(
      async (_shells, _submodels, saveEntity) => { await saveEntity({}); },
    );
  });

  describe("exportTemplate", () => {
    it("should export a fully expanded template", async () => {
      const templateId = randomUUID();
      const aasId = randomUUID();
      const submodelId = randomUUID();

      const template = Template.create({
        id: templateId,
        organizationId: "org-1",
        environment: Environment.create({
          assetAdministrationShells: [aasId],
          submodels: [submodelId],
          conceptDescriptions: [],
        }),
      });

      const aas = AssetAdministrationShell.create({
        id: aasId,
        assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
        submodels: [],
      });

      const submodel = Submodel.create({
        id: submodelId,
        idShort: "testSubmodel",
      });

      mockTemplateRepository.findOneOrFail.mockResolvedValue(template);
      mockEnvironmentService.loadExpandedEnvironment.mockResolvedValue(
        ExpandedEnvironment.fromLoaded([aas], [submodel], []),
      );

      const result = await service.exportTemplate(templateId);

      expect(result.id).toBe(templateId);
      expect(result.environment.assetAdministrationShells).toHaveLength(1);
      expect(result.environment.assetAdministrationShells[0].id).toBe(aasId);
      expect(result.environment.submodels).toHaveLength(1);
      expect(result.environment.submodels[0].id).toBe(submodelId);
    });

    it("should fallback to empty environment when template environment is undefined", async () => {
      const templateId = randomUUID();
      const templateWithoutEnvironment = {
        id: templateId,
        environment: undefined,
        toPlain: () => ({
          id: templateId,
          organizationId: "org-1",
        }),
      } as unknown as Template;

      mockTemplateRepository.findOneOrFail.mockResolvedValue(templateWithoutEnvironment);

      const result = await service.exportTemplate(templateId);

      expect(result.environment.conceptDescriptions).toEqual([]);
      expect(result.environment.assetAdministrationShells).toEqual([]);
      expect(result.environment.submodels).toEqual([]);
      expect(mockEnvironmentService.loadExpandedEnvironment).not.toHaveBeenCalled();
    });
  });

  describe("importTemplate", () => {
    it("should import a template and create new entities", async () => {
      const aasId = randomUUID();
      const submodelId = randomUUID();

      const aasData = AssetAdministrationShell.create({
        id: aasId,
        assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
        submodels: [
          Reference.create({
            type: ReferenceTypes.ModelReference,
            keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId })],
          }),
        ],
      }).toPlain();

      const submodelData = Submodel.create({
        id: submodelId,
        idShort: "testSubmodel",
      }).toPlain();

      const exportData = {
        organizationId: "org-1",
        environment: {
          assetAdministrationShells: [aasData],
          submodels: [submodelData],
          conceptDescriptions: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.importTemplate(exportData);

      expect(result.organizationId).toBe("org-1");
      expect(result.environment.assetAdministrationShells).toHaveLength(1);
      expect(result.environment.submodels).toHaveLength(1);

      const newAasId = result.environment.assetAdministrationShells[0];
      const newSubmodelId = result.environment.submodels[0];

      expect(newAasId).not.toBe(aasId);
      expect(newSubmodelId).not.toBe(submodelId);

      expect(mockEnvironmentService.persistImportedEnvironment).toHaveBeenCalledTimes(1);
      expect(mockTemplateRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should throw BadRequestException if organizationId is missing", async () => {
      const exportData = {
        organizationId: "",
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
      };

      await expect(service.importTemplate(exportData)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if environment data is invalid", async () => {
      const invalidData = {
        organizationId: "org-1",
      };

      await expect(service.importTemplate(invalidData as any)).rejects.toThrow(BadRequestException);
    });
  });
});
