import type { TestingModule } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { MongooseTestingModule } from "@open-dpp/testing";
import { AasConnection } from "../domain/aas-connection";
import { AssetAdministrationShellType } from "../domain/asset-administration-shell";
import { AasConnectionDoc, AasConnectionSchema } from "./aas-connection.schema";
import { AasConnectionService } from "./aas-connection.service";

describe("aasMappingService", () => {
  let aasConnectionService: AasConnectionService;
  const userId = randomUUID();
  const organizationId = randomUUID();
  let mongoConnection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: AasConnectionDoc.name,
            schema: AasConnectionSchema,
          },
        ]),
      ],
      providers: [AasConnectionService],
    }).compile();
    aasConnectionService
      = module.get<AasConnectionService>(AasConnectionService);
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it("fails if requested item could not be found", async () => {
    await expect(aasConnectionService.findById(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(AasConnection.name),
    );
  });

  it("should create and find aas connection", async () => {
    const dataModelId = randomUUID();
    const modelId = randomUUID();
    const fieldMappings = [
      {
        idShortParent: "ProductCarbonFootprint_A1A3",
        idShort: "PCFCO2eq",
        sectionId: "internalSectionId",
        dataFieldId: "internalField",
      },
      {
        idShortParent: "ProductCarbonFootprint_A1A3",
        idShort: "CCFCO2eq",
        sectionId: "internalSectionId",
        dataFieldId: "internalField2",
      },
    ];
    const name = "Connection Name";
    const aasMapping = AasConnection.create({
      name,
      organizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    aasMapping.addFieldAssignment(fieldMappings[0]);
    aasMapping.addFieldAssignment(fieldMappings[1]);

    const { id } = await aasConnectionService.save(aasMapping);
    const foundAasMapping = await aasConnectionService.findById(id);
    expect(foundAasMapping.dataModelId).toEqual(dataModelId);
    expect(foundAasMapping.name).toEqual(name);
    expect(foundAasMapping.modelId).toEqual(modelId);
    expect(foundAasMapping.aasType).toEqual(
      AssetAdministrationShellType.Semitrailer_Truck,
    );
    expect(foundAasMapping.fieldAssignments).toEqual(fieldMappings);
    expect(foundAasMapping.id).toEqual(id);
    expect(foundAasMapping.ownedByOrganizationId).toEqual(organizationId);
    expect(foundAasMapping.createdByUserId).toEqual(userId);
  });

  it("should find all aas connections of organization", async () => {
    const dataModelId = randomUUID();
    const modelId = randomUUID();
    const name1 = "Connection Name 1";
    const otherOrganizationId = randomUUID();
    const aasConnection1 = AasConnection.create({
      name: name1,
      organizationId: otherOrganizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    const name2 = "Connection Name 2";
    const aasConnection2 = AasConnection.create({
      name: name2,
      organizationId: otherOrganizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    const name3 = "Connection of other organization";
    const aasConnection3 = AasConnection.create({
      name: name3,
      organizationId: randomUUID(),
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    await aasConnectionService.save(aasConnection1);
    await aasConnectionService.save(aasConnection2);
    await aasConnectionService.save(aasConnection3);
    const aasConnections
      = await aasConnectionService.findAllByOrganization(otherOrganizationId);
    expect(aasConnections).toEqual([aasConnection1, aasConnection2]);
  });

  afterAll(async () => {
    await mongoConnection.close();
  });
});
