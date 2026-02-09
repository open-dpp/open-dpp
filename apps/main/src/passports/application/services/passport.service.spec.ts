import { jest } from '@jest/globals';
import { Test, TestingModule } from "@nestjs/testing";
import { PassportService } from "./passport.service";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { Passport } from "../../domain/passport";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { Environment } from "../../../aas/domain/environment";
import { AssetInformation } from "../../../aas/domain/asset-information";
import { AssetKindType, ReferenceTypes, KeyTypes } from "@open-dpp/dto";
import { randomUUID } from "crypto";
import { Reference } from "../../../aas/domain/common/reference";
import { Key } from "../../../aas/domain/common/key";

describe("PassportService", () => {
    let service: PassportService;
    let passportRepository: PassportRepository;
    let aasRepository: AasRepository;
    let submodelRepository: SubmodelRepository;

    const mockPassportRepository = {
        findOne: jest.fn(),
        findOneOrFail: jest.fn(),
        save: jest.fn(),
    };

    const mockAasRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockSubmodelRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
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
                    provide: AasRepository,
                    useValue: mockAasRepository,
                },
                {
                    provide: SubmodelRepository,
                    useValue: mockSubmodelRepository,
                },
            ],
        }).compile();

        service = module.get<PassportService>(PassportService);
        passportRepository = module.get<PassportRepository>(PassportRepository);
        aasRepository = module.get<AasRepository>(AasRepository);
        submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);

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
            mockAasRepository.findOne.mockResolvedValue(aas);
            mockSubmodelRepository.findOne.mockResolvedValue(submodel);

            const result = await service.exportPassport(passportId);

            expect(result.id).toBe(passportId);
            expect(result.environment.assetAdministrationShells).toHaveLength(1);
            expect(result.environment.assetAdministrationShells[0].id).toBe(aasId);
            expect(result.environment.submodels).toHaveLength(1);
            expect(result.environment.submodels[0].id).toBe(submodelId);
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
                        keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId })]
                    })
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
    });
});
