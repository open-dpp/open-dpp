import type {
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellResponseDto,
  DeletePolicyDto,
  SubmodelElementListResponseDto,
} from "@open-dpp/dto";
import {
  AssetAdministrationShellPaginationResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  ValueRequestDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import { UserRoleType } from "../../identity/users/domain/user-role.enum";

import { IdShortPath } from "../domain/common/id-short-path";
import { ApiVersionsType } from "../../api-version";

export interface IAasReadEndpointsWithOrganizationId {
  getShells: (
    organizationId: string,
    id: string,
    limit: number | undefined,
    cursor: string | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<AssetAdministrationShellPaginationResponseDto>;
  getSubmodels: (
    organizationId: string,
    id: string,
    limit: number | undefined,
    cursor: string | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    version: ApiVersionsType,
  ) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (
    organizationId: string,
    id: string,
    submodelId: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    version: ApiVersionsType,
  ) => Promise<SubmodelResponseDto>;
  getSubmodelValue: (
    organizationId: string,
    id: string,
    submodelId: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    version: ApiVersionsType,
  ) => Promise<ValueResponseDto>;
  getSubmodelElements: (
    organizationId: string,
    id: string,
    submodelId: string,
    limit: number | undefined,
    cursor: string | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementPaginationResponseDto>;
  getSubmodelElementById: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementResponseDto>;
  getSubmodelElementValue: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    version: ApiVersionsType,
  ) => Promise<ValueResponseDto>;
}

export interface IAasCreateEndpoints {
  createSubmodel: (
    correlationId: string,
    organizationId: string,
    id: string,
    body: SubmodelRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelResponseDto>;
  createSubmodelElement: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementResponseDto>;
  createSubmodelElementAtIdShortPath: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementResponseDto>;
  addColumnToSubmodelElementList: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementListResponseDto>;
  addRowToSubmodelElementList: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    position: number | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementListResponseDto>;
}

export interface IAasModifyEndpoints {
  modifyShell: (
    correlationId: string,
    organizationId: string,
    id: string,
    aasId: string,
    body: AssetAdministrationShellModificationDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<AssetAdministrationShellResponseDto>;
  modifySubmodel: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelModificationDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelResponseDto>;
  modifyValueOfSubmodel: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    body: ValueRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelResponseDto>;
  modifySubmodelElement: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementModificationDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
    version: ApiVersionsType,
  ) => Promise<SubmodelElementResponseDto>;
  modifySubmodelElementValue: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: ValueRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<SubmodelElementResponseDto>;
  modifyColumnOfSubmodelElementList: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    body: SubmodelElementModificationDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<SubmodelElementListResponseDto>;
}

export interface IAasDeleteEndpoints {
  deleteSubmodel: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<void>;
  deleteSubmodelElement: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<void>;
  deleteColumnFromSubmodelElementList: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<SubmodelElementListResponseDto>;
  deleteRowFromSubmodelElementList: (
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfRow: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<SubmodelElementListResponseDto>;
  deletePolicyBySubjectAndObject: (
    correlationId: string,
    organizationId: string,
    id: string,
    body: DeletePolicyDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
    userId: string,
  ) => Promise<void>;
}
