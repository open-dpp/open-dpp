import type { SubmodelElementListResponseDto } from "@open-dpp/dto";
import type express from "express";
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
import { IdShortPath } from "../domain/submodel-base/submodel-base";

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<AssetAdministrationShellPaginationResponseDto>;
  getSubmodels: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (id: string, submodelId: string, req: express.Request) => Promise<SubmodelResponseDto>;
  getSubmodelValue: (id: string, submodelId: string, req: express.Request) => Promise<ValueResponseDto>;
  getSubmodelElements: (
    id: string,
    submodelId: string,
    limit: number | undefined,
    cursor: string | undefined,
    req: express.Request,
  ) => Promise<SubmodelElementPaginationResponseDto>;
  getSubmodelElementById: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
  getSubmodelElementValue: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    req: express.Request,
  ) => Promise<ValueResponseDto>;
}

export interface IAasCreateEndpoints {
  createSubmodel: (id: string, body: SubmodelRequestDto, req: express.Request) => Promise<SubmodelResponseDto>;
  createSubmodelElement: (
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
  createSubmodelElementAtIdShortPath: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
  addColumnToSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
  addRowToSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    position: number | undefined,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
}

export interface IAasModifyEndpoints {
  modifySubmodel: (id: string, submodelId: string, body: SubmodelModificationDto, req: express.Request) => Promise<SubmodelResponseDto>;
  modifySubmodelElement: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementModificationDto,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
  modifySubmodelElementValue: (id: string, submodelId: string, idShortPath: IdShortPath, body: ValueRequestDto, req: express.Request) => Promise<SubmodelElementResponseDto>;
  modifyColumnOfSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    body: SubmodelElementModificationDto,
    req: express.Request,
  ) => Promise<SubmodelElementResponseDto>;
}

export interface IAasDeleteEndpoints {
  deleteSubmodel: (id: string, submodelId: string, req: express.Request) => Promise<void>;
  deleteSubmodelElement: (id: string, submodelId: string, idShortPath: IdShortPath, req: express.Request) => Promise<void>;
  deleteColumnFromSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    req: express.Request,
  ) => Promise<SubmodelElementListResponseDto>;
  deleteRowFromSubmodelElementList: (
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfRow: string,
    req: express.Request,
  ) => Promise<SubmodelElementListResponseDto>;
}
