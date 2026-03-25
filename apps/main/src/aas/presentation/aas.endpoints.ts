import type {
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellResponseDto,
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
import { IdShortPath } from "../domain/submodel-base/submodel-base";

export interface IAasReadEndpointsWithOrganizationId {
  getShells: (organizationId: string, id: string, limit: number | undefined, cursor: string | undefined, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<AssetAdministrationShellPaginationResponseDto>;
  getSubmodels: (organizationId: string, id: string, limit: number | undefined, cursor: string | undefined, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (organizationId: string, id: string, submodelId: string, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelResponseDto>;
  getSubmodelValue: (organizationId: string, id: string, submodelId: string, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<ValueResponseDto>;
  getSubmodelElements: (organizationId: string, id: string, submodelId: string, limit: number | undefined, cursor: string | undefined, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelElementPaginationResponseDto>;
  getSubmodelElementById: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementResponseDto>;
  getSubmodelElementValue: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<ValueResponseDto>;
}

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<AssetAdministrationShellPaginationResponseDto>;
  getSubmodels: (id: string, limit: number | undefined, cursor: string | undefined, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (id: string, submodelId: string, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelResponseDto>;
  getSubmodelValue: (id: string, submodelId: string, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<ValueResponseDto>;
  getSubmodelElements: (id: string, submodelId: string, limit: number | undefined, cursor: string | undefined, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelElementPaginationResponseDto>;
  getSubmodelElementById: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementResponseDto>;
  getSubmodelElementValue: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<ValueResponseDto>;
}

export interface IAasCreateEndpoints {
  createSubmodel: (organizationId: string, id: string, body: SubmodelRequestDto, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelResponseDto>;
  createSubmodelElement: (
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementResponseDto>;
  createSubmodelElementAtIdShortPath: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementResponseDto>;
  addColumnToSubmodelElementList: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementListResponseDto>;
  addRowToSubmodelElementList: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    position: number | undefined,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementListResponseDto>;
}

export interface IAasModifyEndpoints {
  modifyShell: (organizationId: string, id: string, aasId: string, body: AssetAdministrationShellModificationDto, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<AssetAdministrationShellResponseDto>;
  modifySubmodel: (organizationId: string, id: string, submodelId: string, body: SubmodelModificationDto, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelResponseDto>;
  modifySubmodelElement: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementModificationDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementResponseDto>;
  modifySubmodelElementValue: (organizationId: string, id: string, submodelId: string, idShortPath: IdShortPath, body: ValueRequestDto, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<SubmodelElementResponseDto>;
  modifyColumnOfSubmodelElementList: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    body: SubmodelElementModificationDto,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementListResponseDto>;
}

export interface IAasDeleteEndpoints {
  deleteSubmodel: (organizationId: string, id: string, submodelId: string, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<void>;
  deleteSubmodelElement: (organizationId: string, id: string, submodelId: string, idShortPath: IdShortPath, userRole: UserRoleType, memberRole: MemberRoleType | undefined) => Promise<void>;
  deleteColumnFromSubmodelElementList: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementListResponseDto>;
  deleteRowFromSubmodelElementList: (
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfRow: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ) => Promise<SubmodelElementListResponseDto>;
}
