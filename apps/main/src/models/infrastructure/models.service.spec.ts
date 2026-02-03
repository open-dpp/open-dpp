import type { TestingModule } from "@nestjs/testing";
import type { Connection, Model as MongooseModel } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Auth } from "better-auth";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { ignoreIds } from "../../../test/utils.for.test";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UsersModule } from "../../identity/users/users.module";
import { Template } from "../../old-templates/domain/template";
import { laptopFactory } from "../../old-templates/fixtures/laptop.factory";
import { DataValue } from "../../product-passport-data/domain/data-value";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Model } from "../domain/model";
import { ModelDoc, ModelDocSchemaVersion, ModelSchema } from "./model.schema";
import { ModelsService } from "./models.service";

describe("modelsService", () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let mongoConnection: Connection;
  let modelDoc: MongooseModel<ModelDoc>;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          {
            name: ModelDoc.name,
            schema: ModelSchema,
          },
        ]),
        AuthModule,
        UsersModule,
      ],
      providers: [
        ModelsService,
        UniqueProductIdentifierService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    modelsService = module.get<ModelsService>(ModelsService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    modelDoc = mongoConnection.model(ModelDoc.name, ModelSchema);
    betterAuthHelper.init(module.get<UsersService>(UsersService), module.get<Auth>(AUTH));

    app = module.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it("should create a model", async () => {
    const { org, user } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = Template.loadFromDb(
      laptopFactory
        .addSections()
        .build({ organizationId: org.id, userId: user.id }),
    );
    const model = Model.create({
      name: "My product",
      userId: user.id,
      organizationId: org.id,
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
    expect(foundModel.createdByUserId).toEqual(user.id);
    expect(foundModel.isOwnedBy(org.id)).toBeTruthy();
  });

  it("fails if requested model could not be found", async () => {
    await expect(modelsService.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(Model.name),
    );
  });

  it("should find all models of organization", async () => {
    const { org, user } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const otherOrganizationId = randomUUID();
    const template = Template.loadFromDb(
      laptopFactory
        .addSections()
        .build({ organizationId: org.id, userId: user.id }),
    );

    const model1 = Model.create({
      name: "Product A",
      userId: user.id,
      organizationId: otherOrganizationId,
      template,
    });
    const model2 = Model.create({
      name: "Product B",
      userId: user.id,
      organizationId: otherOrganizationId,
      template,
    });
    const model3 = Model.create({
      name: "Product C",
      userId: user.id,
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
    if (app) {
      await app.close();
    }
  });
});
