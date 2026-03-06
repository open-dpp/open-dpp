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
import { Session } from "../../identity/auth/domain/session";
import { IdShortPath } from "../domain/submodel-base/submodel-base";

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, session: Session) => Promise<AssetAdministrationShellPaginationResponseDto>;
  getSubmodels: (id: string, limit: number | undefined, cursor: string | undefined, session: Session) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (id: string, submodelId: string, session: Session) => Promise<SubmodelResponseDto>;
  getSubmodelValue: (id: string, submodelId: string, session: Session) => Promise<ValueResponseDto>;
  getSubmodelElements: (
    id: string,
    submodelId: string,
    limit: number | undefined,
    cursor: string | undefined,
    session: Session,
  ) => Promise<SubmodelElementPaginationResponseDto>;
  getSubmodelElementById: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    session: Session,
  ) => Promise<SubmodelElementResponseDto>;
  getSubmodelElementValue: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    session: Session,
  ) => Promise<ValueResponseDto>;
}

export interface IAasCreateEndpoints {
  createSubmodel: (id: string, body: SubmodelRequestDto, session: Session) => Promise<SubmodelResponseDto>;
  createSubmodelElement: (
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    session: Session,
  ) => Promise<SubmodelElementResponseDto>;
  createSubmodelElementAtIdShortPath: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    session: Session,
  ) => Promise<SubmodelElementResponseDto>;
  addColumnToSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    session: Session,
  ) => Promise<SubmodelElementListResponseDto>;
  addRowToSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    position: number | undefined,
    session: Session,
  ) => Promise<SubmodelElementListResponseDto>;
}

export interface IAasModifyEndpoints {
  modifyShell: (id: string, aasId: string, body: AssetAdministrationShellModificationDto, session: Session) => Promise<AssetAdministrationShellResponseDto>;
  modifySubmodel: (id: string, submodelId: string, body: SubmodelModificationDto, session: Session) => Promise<SubmodelResponseDto>;
  modifySubmodelElement: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementModificationDto,
    session: Session,
  ) => Promise<SubmodelElementResponseDto>;
  modifySubmodelElementValue: (id: string, submodelId: string, idShortPath: IdShortPath, body: ValueRequestDto, session: Session) => Promise<SubmodelElementResponseDto>;
  modifyColumnOfSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    body: SubmodelElementModificationDto,
    session: Session,
  ) => Promise<SubmodelElementListResponseDto>;
}

export interface IAasDeleteEndpoints {
  deleteSubmodel: (id: string, submodelId: string, session: Session) => Promise<void>;
  deleteSubmodelElement: (id: string, submodelId: string, idShortPath: IdShortPath, session: Session) => Promise<void>;
  deleteColumnFromSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    session: Session,
  ) => Promise<SubmodelElementListResponseDto>;
  deleteRowFromSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfRow: string,
    session: Session,
  ) => Promise<SubmodelElementListResponseDto>;
}
