import { Injectable } from "@nestjs/common";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { createAasObject } from "../domain/security/aas-object";
import { Permission } from "../domain/security/permission";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { IdShortPath } from "../domain/submodel-base/submodel-base";
import { AasRepository } from "./aas.repository";

import { SecurityRepository } from "./security.repository";
import { SubmodelRepository } from "./submodel.repository";

@Injectable()
export class InitializeSecurityMigrationService {
  constructor(
    private readonly aasRepository: AasRepository,
    private readonly securityRepository: SecurityRepository,
    private readonly submodelRepository: SubmodelRepository,
  ) {
  }

  async migrate(digitalProductPassportIdentifier: { environment: { assetAdministrationShells: string[]; submodels: string[] }; organizationId: string }) {
    // This migration is done in the passport repository since the other repositories are not aware of the organizationId
    const aasId = digitalProductPassportIdentifier.environment.assetAdministrationShells[0];
    const aas = await this.aasRepository.findOneOrFail(aasId);
    const security = await this.securityRepository.findOneOrFail(aas.security);
    // initialize meaningful default policies for the aas submodels
    for (const submodelId of digitalProductPassportIdentifier.environment.submodels) {
      const submodel = await this.submodelRepository.findOneOrFail(submodelId);
      // admin should have all permissions
      security.addPolicy(
        SubjectAttributes.create({ role: UserRole.ADMIN }),
        createAasObject(IdShortPath.create({ path: submodel.idShort })),
        Object.values(Permissions).map(
          p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
        ),
      );
      // member of the organization to which the passport belongs to should have all permissions
      security.addPolicy(
        SubjectAttributes.create({ role: MemberRole.MEMBER, organizationId: digitalProductPassportIdentifier.organizationId }),
        createAasObject(IdShortPath.create({ path: submodel.idShort })),
        Object.values(Permissions).map(
          p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
        ),
      );
      // anonymous user should have only read permissions
      security.addPolicy(
        SubjectAttributes.create({ role: UserRole.ANONYMOUS }),
        createAasObject(IdShortPath.create({ path: submodel.idShort })),
        [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      );
    }
    await this.securityRepository.save(security);
  }
}
