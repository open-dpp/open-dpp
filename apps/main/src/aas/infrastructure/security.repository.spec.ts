import type { TestingModule } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { PermissionKind, Permissions } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { UserRole } from "../../identity/users/domain/user-role.enum";

import { createAasObject } from "../domain/security/aas-object";
import { Permission } from "../domain/security/permission";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { IdShortPath } from "../domain/submodel-base/submodel-base";
import { SecurityDbSchema, SecurityDoc } from "./schemas/security/security-db-schema";
import { SecurityRepository } from "./security.repository";

describe("securityRepository", () => {
  let securityRepository: SecurityRepository;
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
            name: SecurityDoc.name,
            schema: SecurityDbSchema,
          },
        ]),
      ],
      providers: [
        SecurityRepository,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    securityRepository = module.get<SecurityRepository>(SecurityRepository);
  });

  it("should save a security", async () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), createAasObject(IdShortPath.create({ path: "section1" })), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), createAasObject(IdShortPath.create({ path: "section1.field1" })), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })]);
    await securityRepository.save(security);
    const foundAas = await securityRepository.findOneOrFail(security.id);
    expect(foundAas).toEqual(security);
  });

  afterAll(async () => {
    await module.close();
  });
});
