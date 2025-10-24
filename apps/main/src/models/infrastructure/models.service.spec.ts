import type { TestingModule } from "@nestjs/testing";
import type { Connection, Model as MongooseModel } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { ignoreIds, MongooseTestingModule } from "@open-dpp/testing";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { AuthService } from "../../auth/auth.service";
import { EmailService } from "../../email/email.service";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { Template } from "../../templates/domain/template";
import { laptopFactory } from "../../templates/fixtures/laptop.factory";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { UsersService } from "../../users/infrastructure/users.service";
import { Model } from "../domain/model";
import { ModelDoc, ModelDocSchemaVersion, ModelSchema } from "./model.schema";
import { ModelsService } from "./models.service";

describe("modelsService", () => {
  let modelsService: ModelsService;
  let mongoConnection: Connection;
  let modelDoc: MongooseModel<ModelDoc>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          {
            name: ModelDoc.name,
            schema: ModelSchema,
          },
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
        ]),
      ],
      providers: [
        ModelsService,
        UniqueProductIdentifierService,
        OrganizationsService,
        UsersService,
        {
          provide: EmailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            getUserById: jest.fn(),
          },
        },
      ],
    })
      .compile();

    modelsService = module.get<ModelsService>(ModelsService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    modelDoc = mongoConnection.model(ModelDoc.name, ModelSchema);

    const organizationService = module.get<OrganizationsService>(OrganizationsService);
    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

  it("should create a model", async () => {
    const template = Template.loadFromDb(
      laptopFactory
        .addSections()
        .build({ organizationId: TestUsersAndOrganizations.organizations.org1.id, userId: TestUsersAndOrganizations.users.user1.id }),
    );
    const model = Model.create({
      name: "My product",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });

    model.addDataValues([
      DataValue.create({
        value: undefined,
        dataSectionId: template.sections[2].id,
        dataFieldId: template.sections[2].dataFields[0].id,
        row: 0,
      }),
    ]);
    const { id } = await modelsService.save(model);
    const foundModel = await modelsService.findOneOrFail(id);
    expect(foundModel.name).toEqual(model.name);
    expect(foundModel.description).toEqual(model.description);
    expect(foundModel.templateId).toEqual(template.id);
    expect(foundModel.dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[0].id,
          dataFieldId: template.sections[0].dataFields[0].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[0].id,
          dataFieldId: template.sections[0].dataFields[1].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[1].id,
          dataFieldId: template.sections[1].dataFields[0].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template.sections[2].id,
          dataFieldId: template.sections[2].dataFields[0].id,
          row: 0,
        }),
      ]),
    );
    expect(foundModel.createdByUserId).toEqual(TestUsersAndOrganizations.users.user1.id);
    expect(foundModel.isOwnedBy(TestUsersAndOrganizations.organizations.org1.id)).toBeTruthy();
  });

  it("fails if requested model could not be found", async () => {
    await expect(modelsService.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(Model.name),
    );
  });

  it("should find all models of organization", async () => {
    const otherOrganizationId = randomUUID();
    const template = Template.loadFromDb(
      laptopFactory
        .addSections()
        .build({ organizationId: TestUsersAndOrganizations.organizations.org1.id, userId: TestUsersAndOrganizations.users.user1.id }),
    );

    const model1 = Model.create({
      name: "Product A",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: otherOrganizationId,
      template,
    });
    const model2 = Model.create({
      name: "Product B",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: otherOrganizationId,
      template,
    });
    const model3 = Model.create({
      name: "Product C",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model1);
    await modelsService.save(model2);
    await modelsService.save(model3);

    const foundModels
      = await modelsService.findAllByOrganization(otherOrganizationId);
    expect(foundModels.map(m => m)).toEqual(
      [model1, model2, model3].map(m => m),
    );
  });

  it(`should migrate from ${ModelDocSchemaVersion.v1_0_0} to ${ModelDocSchemaVersion.v1_0_1}`, async () => {
    const id = randomUUID();
    await modelDoc.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          _schemaVersion: ModelDocSchemaVersion.v1_0_0,
          name: "Migration Name",
          description: "desc",
          productDataModelId: "templateId",
          dataValues: [],
          createdByUserId: "userId",
          ownedByOrganizationId: "orgId",
        },
      },
      { upsert: true },
    );
    const found = await modelsService.findOneOrFail(id); // or _id: new ObjectId(idAsString)
    expect(found.templateId).toEqual("templateId");
    const saved = await modelsService.save(found);
    expect(saved.templateId).toEqual("templateId");
  });

  afterAll(async () => {
    await mongoConnection.close();
  });
});
