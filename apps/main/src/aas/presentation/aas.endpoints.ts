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
}
