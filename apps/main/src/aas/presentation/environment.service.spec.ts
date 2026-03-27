import type { TestingModule } from "@nestjs/testing";
import { expect } from "@jest/globals";

import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import {
  AssetKind,
  LanguageTextDto,
  MemberRoleDto,
  PermissionKind,
  Permissions,
  SubmodelJsonSchema,
  UserRoleDto,
} from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ForbiddenError } from "@open-dpp/exception";
import { securityPlainFactory, SecurityPlainTransientParams } from "@open-dpp/testing";
import { generateMongoConfig } from "../../database/config";
import { AuthModule } from "../../identity/auth/auth.module";

import { MemberRole } from "../../identity/organizations/domain/member-role.enum";

import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../identity/users/users.module";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportsModule } from "../../passports/passports.module";
import { AasModule } from "../aas.module";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { LanguageText } from "../domain/common/language-text";
import { Environment } from "../domain/environment";
import { createAasObject } from "../domain/security/aas-object";
import { Permission } from "../domain/security/permission";
import { PermissionPerObject } from "../domain/security/permission-per-object";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { Submodel } from "../domain/submodel-base/submodel";
import { IdShortPath } from "../domain/submodel-base/submodel-base";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { EnvironmentService } from "./environment.service";

describe("environmentService", () => {
  let environmentService: EnvironmentService;
  let aasRepository: AasRepository;
  let submodelRepository: SubmodelRepository;
  let module: TestingModule;
  let passportRepository: PassportRepository;
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
        PassportsModule,
        AasModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
    }).compile();
    await module.init();
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    passportRepository = module.get<PassportRepository>(PassportRepository);
    aasRepository = module.get<AasRepository>(AasRepository);
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
  });

  it("should create environment", async () => {
    const displayName: LanguageTextDto[] = [{ language: "en", text: "Test AAS" }];
    const description: LanguageTextDto[] = [{ language: "en", text: "Test AAS description" }];
    const environment = await environmentService.createEnvironment({
      assetAdministrationShells: [{ displayName, description }],
    }, true);
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Type);
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
    expect(aas.description).toEqual(description.map(LanguageText.fromPlain));
  });

  it("should create environment with empty aas", async () => {
    const environment = await environmentService.createEnvironment({
      assetAdministrationShells: [],
    }, false);
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
  });

  it("should populate paging result", async () => {
    const assetAdministrationShell = AssetAdministrationShell.create(
      { assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }) },
    );
    const environment = Environment.create({ assetAdministrationShells: [assetAdministrationShell.id] });
    await aasRepository.save(assetAdministrationShell);
    const passport = Passport.create({ environment, organizationId: "organizationId" });
    await passportRepository.save(passport);
    const pagingResult = PagingResult.create({ pagination: Pagination.create({}), items: [passport] });
    const result = await environmentService.populateEnvironmentForPagingResult(
      pagingResult,
      { assetAdministrationShells: true, ignoreMissing: false },
    );
    expect(result.toPlain()).toEqual({
      result: [
        {
          ...passport.toPlain(),
          environment: {
            ...environment.toPlain(),
            assetAdministrationShells: [assetAdministrationShell.toPlain()],
          },
        },
      ],
      paging_metadata: {
        cursor: null,
      },
    });
  });

  it("should load security policies for given subject", async () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);

    const assetAdministrationShell = AssetAdministrationShell.create(
      { assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }), security },
    );
    await aasRepository.save(assetAdministrationShell);
    const environment = Environment.create({ assetAdministrationShells: [assetAdministrationShell.id] });
    await aasRepository.save(assetAdministrationShell);
    const subject = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const result = await environmentService.loadAbility(environment, subject);
    expect(result.can(Permissions.Read, IdShortPath.create({ path: "section1" }))).toBeTruthy();
  });

  it("should modify asset administration shell", async () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    await aasRepository.save(assetAdministrationShell);
    const environment = Environment.create({ assetAdministrationShells: [assetAdministrationShell.id] });

    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: {
            userRole: UserRoleDto.USER,
            memberRole: MemberRoleDto.MEMBER,
          },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };

    await environmentService.modifyAasShell(
      environment,
      assetAdministrationShell.id,
      { security: securityPlainFactory.build(
        undefined,
        { transient: transientParams },
      ) },
      SubjectAttributes.create({ userRole: UserRole.ADMIN }),
    );

    const foundAas = await aasRepository.findOneOrFail(assetAdministrationShell.id);
    expect(foundAas.security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [
              Permission.create({
                permission: Permissions.Create,
                kindOfPermission: PermissionKind.Allow,
              }),
              Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
            ],
          }),
        ],
      },
    ]);
  });

  it("should modify asset administration shell fails due to insufficient permissions", async () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow })]);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    await aasRepository.save(assetAdministrationShell);
    const environment = Environment.create({ assetAdministrationShells: [assetAdministrationShell.id] });

    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: {
            userRole: UserRoleDto.ADMIN,
          },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };

    await expect(environmentService.modifyAasShell(
      environment,
      assetAdministrationShell.id,
      { security: securityPlainFactory.build(
        undefined,
        { transient: transientParams },
      ) },
      SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
    )).rejects.toThrow(new ForbiddenError("Administrator has no permission to add/ modify policy."));
  });

  it("should return submodels for subject", async () => {
    const security = Security.create({});
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(admin, IdShortPath.create({ path: "section1" }), [Permission.create({
      permission: Permissions.Read,
      kindOfPermission: PermissionKind.Allow,
    })]);

    const submodel1 = Submodel.create({ idShort: "section1" });
    await submodelRepository.save(submodel1);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    assetAdministrationShell.addSubmodel(submodel1);
    await aasRepository.save(assetAdministrationShell);

    const environment = Environment.create({ assetAdministrationShells: [assetAdministrationShell.id], submodels: [submodel1.id] });
    const pagination = Pagination.create({ limit: 10 });
    let submodels = await environmentService.getSubmodels(environment, pagination, admin);
    expect(submodels.result).toEqual([SubmodelJsonSchema.parse(submodel1.toPlain())]);

    submodels = await environmentService.getSubmodels(environment, pagination, member);
    expect(submodels.result).toEqual([]);
  });

  afterAll(async () => {
    await module.close();
  });
});
