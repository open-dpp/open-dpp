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
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { PassportService } from "./passport.service";

describe("passportService", () => {
  let service: PassportService;

  const mockPassportRepository = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
  };

  const mockAasRepository = {
    findOne: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
  };

  const mockSubmodelRepository = {
    findOne: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
  };

  const mockSession = {
    withTransaction: jest.fn((fn: () => Promise<void>) => fn()),
    endSession: jest.fn(),
  };

  const mockEnvironmentService = {
    getFullEnvironmentAsPlain: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassportService,
        {
          provide: PassportRepository,
          useValue: mockPassportRepository,
        },
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService,
        },
        {
          provide: AasRepository,
          useValue: mockAasRepository,
        },
        {
          provide: SubmodelRepository,
          useValue: mockSubmodelRepository,
        },
        {
          provide: "DatabaseConnection",
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<PassportService>(PassportService);
    jest.clearAllMocks();
  });

  describe("exportPassport", () => {
    it("should export a fully expanded passport", async () => {
      const passportId = randomUUID();
      const aasId = randomUUID();
      const submodelId = randomUUID();

      const passport = Passport.create({
        id: passportId,
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

      mockPassportRepository.findOneOrFail.mockResolvedValue(passport);
      mockAasRepository.findByIds.mockResolvedValue(new Map([[aasId, aas]]));
      mockSubmodelRepository.findByIds.mockResolvedValue(new Map([[submodelId, submodel]]));

      const result = await service.exportPassport(passportId);

      expect(result.id).toBe(passportId);
      expect(result.environment.assetAdministrationShells).toHaveLength(1);
      expect(result.environment.assetAdministrationShells[0].id).toBe(aasId);
      expect(result.environment.submodels).toHaveLength(1);
      expect(result.environment.submodels[0].id).toBe(submodelId);
    });

    it("should fallback to empty conceptDescriptions when passport environment is undefined", async () => {
      const passportId = randomUUID();
      const passportWithoutEnvironment = {
        id: passportId,
        environment: undefined,
        toPlain: () => ({
          id: passportId,
          organizationId: "org-1",
        }),
      } as unknown as Passport;

      mockPassportRepository.findOneOrFail.mockResolvedValue(passportWithoutEnvironment);
      jest.spyOn(service as any, "loadEnvironment").mockResolvedValue({ shells: [], submodels: [] });

      const result = await service.exportPassport(passportId);

      expect(result.environment.conceptDescriptions).toEqual([]);
      expect(result.environment.assetAdministrationShells).toEqual([]);
      expect(result.environment.submodels).toEqual([]);
    });
  });

  describe("importPassport", () => {
    it("should import a passport and create new entities", async () => {
      const passportId = randomUUID();
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
        id: passportId,
        organizationId: "org-1",
        templateId: null,
        environment: {
          assetAdministrationShells: [aasData],
          submodels: [submodelData],
          conceptDescriptions: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.importPassport(exportData as any);

      expect(result.organizationId).toBe("org-1");
      expect(result.environment.assetAdministrationShells).toHaveLength(1);
      expect(result.environment.submodels).toHaveLength(1);

      // Verify IDs are different (regenerated)
      const newAasId = result.environment.assetAdministrationShells[0];
      const newSubmodelId = result.environment.submodels[0];

      expect(newAasId).not.toBe(aasId);
      expect(newSubmodelId).not.toBe(submodelId);

      expect(mockSubmodelRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAasRepository.save).toHaveBeenCalledTimes(1);
      expect(mockPassportRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should throw BadRequestException if environment data is missing", async () => {
      const invalidData = {
        organizationId: "org-1",
        // Missing environment
      };

      await expect(service.importPassport(invalidData as any)).rejects.toThrow(BadRequestException);
    });
  });
});
