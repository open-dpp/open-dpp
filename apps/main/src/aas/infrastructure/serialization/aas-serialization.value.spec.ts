import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { DataTypeDef, PresentationReferenceType } from "@open-dpp/dto";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { MediaService } from "../../../media/infrastructure/media.service";
import { Passport } from "../../../passports/domain/passport";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { Environment } from "../../domain/environment";
import { ExpandedEnvironment } from "../../domain/expanded-environment";
import { Security } from "../../domain/security/security";
import { SubjectAttributes } from "../../domain/security/subject-attributes";
import { Property } from "../../domain/submodel-base/property";
import { Submodel } from "../../domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../../domain/submodel-base/submodel-element-collection";
import { EnvironmentService } from "../../presentation/environment.service";
import { AasRepository } from "../aas.repository";
import { ConceptDescriptionRepository } from "../concept-description.repository";
import { SubmodelRepository } from "../submodel.repository";
import { AasSerializationService } from "./aas-serialization.service";

describe("export submodel value", () => {
  let aasSerializationService: AasSerializationService;
  let environmentService: EnvironmentService;
  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AasSerializationService,
        {
          provide: EnvironmentService,
          useValue: {
            loadExpandedEnvironment: jest.fn(),
          },
        },
        { provide: AasRepository, useValue: {} },
        { provide: SubmodelRepository, useValue: {} },
        { provide: ConceptDescriptionRepository, useValue: {} },
        {
          provide: MediaService,
          useValue: { findByIds: jest.fn<() => Promise<string[]>>().mockResolvedValue([]) },
        },
        {
          provide: PresentationConfigurationService,
          useValue: {
            findOrInstantiateForPassport: jest
              .fn<(passport: Passport) => Promise<PresentationConfiguration>>()
              .mockImplementation(async (passport: Passport) =>
                PresentationConfiguration.create({
                  organizationId: passport.organizationId,
                  referenceId: passport.id,
                  referenceType: PresentationReferenceType.Passport,
                }),
              ),
          },
        },
        { provide: PresentationConfigurationRepository, useValue: {} },
      ],
    }).compile();

    aasSerializationService = module.get<AasSerializationService>(AasSerializationService);
    environmentService = module.get<EnvironmentService>(EnvironmentService);
  });

  it("should include the property value in the exported passport", async () => {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: "org-1",
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: ["submodel-1"],
        conceptDescriptions: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const property = Property.create({
      idShort: "testProp",
      valueType: DataTypeDef.String,
      value: "my-test-value",
    });

    const submodel = Submodel.create({
      id: "submodel-1",
      idShort: "testSubmodel",
      submodelElements: [property],
    });

    const security = Security.create({});
    security.addDefaultPolicyForSubmodelIfNoExists(submodel);
    const aas = AssetAdministrationShell.create({ security });

    const expandedEnvironment = ExpandedEnvironment.fromLoaded([aas], [submodel], []);
    (
      environmentService.loadExpandedEnvironment as jest.Mock<() => Promise<ExpandedEnvironment>>
    ).mockResolvedValue(expandedEnvironment);

    const exportResult = await aasSerializationService.exportPassport(passport, member);
    const exportedElement = exportResult.environment.submodels[0].submodelElements[0];
    expect(exportedElement.value).toBe("my-test-value");
    expect(exportedElement.valueType).toBe("String");
  });

  it("should include nested values for SubmodelElementCollection", async () => {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: "org-1",
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: ["submodel-1"],
        conceptDescriptions: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const property = Property.create({
      idShort: "nestedProp",
      valueType: DataTypeDef.String,
      value: "nested-value",
    });

    const collection = SubmodelElementCollection.create({
      idShort: "myCollection",
      value: [property],
    });

    const submodel = Submodel.create({
      id: "submodel-1",
      idShort: "testSubmodel",
      submodelElements: [collection],
    });

    const expandedEnvironment = ExpandedEnvironment.fromLoaded([], [submodel], []);
    (
      environmentService.loadExpandedEnvironment as jest.Mock<() => Promise<ExpandedEnvironment>>
    ).mockResolvedValue(expandedEnvironment);

    const exportResult = await aasSerializationService.exportPassport(passport, member);
    const exportedCollection = exportResult.environment.submodels[0].submodelElements[0] as any;
    expect(exportedCollection.modelType).toBe("SubmodelElementCollection");
    expect(exportedCollection.value).toHaveLength(1);
    expect(exportedCollection.value[0].modelType).toBe("Property");
    expect(exportedCollection.value[0].value).toBe("nested-value");
  });

  it("should include null value when property has no value", async () => {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: "org-1",
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: ["submodel-1"],
        conceptDescriptions: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const property = Property.create({
      idShort: "emptyProp",
      valueType: DataTypeDef.String,
    });

    const submodel = Submodel.create({
      id: "submodel-1",
      idShort: "testSubmodel",
      submodelElements: [property],
    });

    const expandedEnvironment = ExpandedEnvironment.fromLoaded([], [submodel], []);
    (
      environmentService.loadExpandedEnvironment as jest.Mock<() => Promise<ExpandedEnvironment>>
    ).mockResolvedValue(expandedEnvironment);

    const exportResult = await aasSerializationService.exportPassport(passport, member);
    const exportedElement = exportResult.environment.submodels[0].submodelElements[0];
    expect(exportedElement.value).toBeNull();
  });
});
