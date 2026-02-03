import { AssetAdministrationShellPaginationResponseDto, SubmodelElementPaginationResponseDto, SubmodelElementRequestDto, SubmodelElementResponseDto, SubmodelPaginationResponseDto, SubmodelRequestDto, SubmodelResponseDto, ValueResponseDto } from "@open-dpp/dto";
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
}
