import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { Model, Model as MongooseModel } from "mongoose";
import { DataTypeDef, EntityType, PermissionKind, Permissions } from "@open-dpp/dto";

import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { LanguageText } from "../domain/common/language-text";
import { Entity } from "../domain/submodel-base/entity";
import { Property } from "../domain/submodel-base/property";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelRegistryInitializer } from "../presentation/submodel-registry-initializer";
import { SubmodelDoc, SubmodelDocSchemaVersion, SubmodelSchema } from "./schemas/submodel.schema";
import { SubmodelRepository } from "./submodel.repository";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { IdShortPath } from "../domain/common/id-short-path";
import { Permission } from "../domain/security/permission";

describe("submodelRepository", () => {
  let submodelRepository: SubmodelRepository;
  let submodelDoc: MongooseModel<SubmodelDoc>;
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
          {
            name: SubmodelDoc.name,
            schema: SubmodelSchema,
          },
        ]),
      ],
      providers: [SubmodelRegistryInitializer, SubmodelRepository],
    }).compile();
    await module.init();
    submodelDoc = module.get<Model<SubmodelDoc>>(getModelToken(SubmodelDoc.name));
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
  });

  it(`should load and migrate submodel from version 1.0.0 to 1.1.0`, async () => {
    const id = randomUUID();
    const legacyDoc = new submodelDoc({
      _id: id,
      _schemaVersion: SubmodelDocSchemaVersion.v1_0_0,
      idShort: "testmodel",
      displayName: [
        { language: "en", text: "My submodel" },
        { language: "de", text: "Mein Submodel" },
      ],
      description: [
        { language: "en", text: "My submodel for examples" },
        { language: "de", text: "Mein Submodel für Beispiele" },
      ],
    });

    await legacyDoc.save({ validateBeforeSave: false });
    const foundSubmodel = await submodelRepository.findOne(id);

    expect(foundSubmodel).toEqual(
      Submodel.fromPlain({
        id,
      idShort: "testmodel",
        displayName: [
          { language: "en-US", text: "My submodel" },
          { language: "de-DE", text: "Mein Submodel" },
        ],
        description: [
          { language: "en-US", text: "My submodel for examples" },
          { language: "de-DE", text: "Mein Submodel für Beispiele" },
        ],
      }),
    );
  });

  it("should save a submodel", async () => {
    const entity = Entity.create({
      entityType: EntityType.CoManagedEntity,
      idShort: "EntityId",
      statements: [
        Entity.create({
          entityType: EntityType.CoManagedEntity,
          idShort: "EntitySubId",
          statements: [
            Property.create({
              value:
                "http://shells.smartfactory.de/aHR0cHM6Ly9zbWFydGZhY3RvcnkuZGUvc2hlbGxzLy1TUjdCYm5jSkc",
              valueType: DataTypeDef.String,
              category: "CONSTANT",
              description: [
                LanguageText.create({
                  language: "en-US",
                  text: "URL of the application",
                }),
                LanguageText.create({
                  language: "de-DE",
                  text: "URL der Anwendung",
                }),
              ],
              idShort: "ApplicationURL",
            }),
          ],
        }),
      ],
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "carbon footprint",
      administration: AdministrativeInformation.create({ version: "1.0.0", revision: "1" }),
      submodelElements: [
        Property.create({
          idShort: "carbon footprint",
          valueType: DataTypeDef.Double,
          value: "1000",
        }),
        entity,
      ],
    });
    await submodelRepository.save(submodel);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    expect(foundSubmodel).toEqual(submodel);
  });

  it("should save audit event of submodel", async () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    const submodel = Submodel.create({ idShort: "section1" });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member, "userId");
    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(prop1, { ability });
    const digitalProductDocumentId = randomUUID();

    submodel.modifySubmodelElement(
      { idShort: prop1.idShort, value: "20" },
      IdShortPath.create({ path: "prop1" }),
      {
        ability,
        digitalProductDocumentId,
      },
    );

    await submodelRepository.save(submodel);
  });

  it("should delete a submodel", async () => {
    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "carbon footprint",
      administration: AdministrativeInformation.create({ version: "1.0.0", revision: "1" }),
      submodelElements: [
        Property.create({
          idShort: "carbon footprint",
          valueType: DataTypeDef.Double,
          value: "1000",
        }),
      ],
    });
    await submodelRepository.save(submodel);
    let foundSubmodel = await submodelRepository.findOne(submodel.id);
    expect(foundSubmodel).toEqual(submodel);
    await submodelRepository.deleteById(submodel.id);
    foundSubmodel = await submodelRepository.findOne(submodel.id);
    expect(foundSubmodel).toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
