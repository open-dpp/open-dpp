import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { DbSessionOptions } from "../../database/query-options";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { findByIds, findOne, findOneOrFail, save } from "../../lib/repositories";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { Permission } from "../domain/security/permission";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { IdShortPath } from "../domain/submodel-base/submodel-base";
import { AssetAdministrationShellDbSchema } from "./schemas/asset-administration-shell-db-schema";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellDocSchemaVersion,
} from "./schemas/asset-administration-shell.schema";
import { ReferenceDb } from "./schemas/db-types";
import { SecurityDb } from "./schemas/security/security-db-schema";
import { SubmodelRepository } from "./submodel.repository";

@Injectable()
export class AasRepository {
  private aasDoc: MongooseModel<AssetAdministrationShellDoc>;

  constructor(
    @InjectModel(AssetAdministrationShellDoc.name)
    aasDoc: MongooseModel<AssetAdministrationShellDoc>,
    private readonly submodelRepository: SubmodelRepository,
  ) {
    this.aasDoc = aasDoc;
  }

  async fromPlain(plain: any) {
    return AssetAdministrationShell.fromPlain(AssetAdministrationShellDbSchema.encode(plain));
  }

  migrate1_0_0To1_1_0(aas: { assetInformation: { defaultThumbnail: { path: string; contentType: string | null } } }) {
    return {
      ...aas,
      assetInformation: {
        ...aas.assetInformation,
        defaultThumbnails: aas.assetInformation.defaultThumbnail ? [aas.assetInformation.defaultThumbnail] : [],
      },
      _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_1_0,
    };
  }

  async migrate1_1_0To1_2_0(aas: { _id: string; submodels: ReferenceDb[]; security?: SecurityDb }) {
    if (aas.security !== undefined) {
      return {
        ...aas,
        _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_2_0,
      };
    }
    const security = Security.create({});

    for (const submodelReference of aas.submodels) {
      const submodel = await this.submodelRepository.findOneOrFail(submodelReference.keys[0].value);
      let [subject, aasObject, permissions] = [
        SubjectAttributes.create({ role: UserRole.ADMIN }),
        IdShortPath.create({ path: submodel.idShort }),
        Object.values(Permissions).map(
          p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
        ),
      ];
      if (!security.hasPolicy(subject, aasObject, permissions)) {
        security.addPolicy(subject, aasObject, permissions);
      }
      // member of the organization to which the passport belongs to should have all permissions
      [subject, aasObject, permissions] = [
        SubjectAttributes.create({ role: MemberRole.MEMBER }),
        IdShortPath.create({ path: submodel.idShort }),
        Object.values(Permissions).map(
          p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
        ),
      ];
      if (!security.hasPolicy(subject, aasObject, permissions)) {
        security.addPolicy(subject, aasObject, permissions);
      }
      // anonymous user should have only read permissions
      [subject, aasObject, permissions] = [
        SubjectAttributes.create({ role: UserRole.ANONYMOUS }),
        IdShortPath.create({ path: submodel.idShort }),
        [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      ];
      if (!security.hasPolicy(subject, aasObject, permissions)) {
        security.addPolicy(subject, aasObject, permissions);
      };
    }

    return {
      ...aas,
      security: security.toPlain(),
    };
  }

  async fromPlainWithMigration(plain: any): Promise<AssetAdministrationShell> {
    let migratedVersion = plain;
    if (migratedVersion._schemaVersion === AssetAdministrationShellDocSchemaVersion.v1_0_0) {
      migratedVersion = this.migrate1_0_0To1_1_0(migratedVersion);
    }
    if (migratedVersion._schemaVersion === AssetAdministrationShellDocSchemaVersion.v1_1_0) {
      migratedVersion = await this.migrate1_1_0To1_2_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async save(assetAdministrationShell: AssetAdministrationShell, options?: DbSessionOptions) {
    return await save(assetAdministrationShell, this.aasDoc, AssetAdministrationShellDocSchemaVersion.v1_2_0, this.fromPlain.bind(this), AssetAdministrationShellDbSchema, options);
  }

  async findOneOrFail(id: string): Promise<AssetAdministrationShell> {
    return await findOneOrFail(id, this.aasDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOne(id: string): Promise<AssetAdministrationShell | undefined> {
    return await findOne(id, this.aasDoc, this.fromPlainWithMigration.bind(this));
  }

  async findByIds(ids: string[]): Promise<Map<string, AssetAdministrationShell>> {
    return await findByIds(ids, this.aasDoc, this.fromPlainWithMigration.bind(this));
  }
}
