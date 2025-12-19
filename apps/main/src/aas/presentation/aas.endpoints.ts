import type express from "express";
import { AssetAdministrationShellResponseDto, SubmodelElementPaginationResponseDto, SubmodelElementRequestDto, SubmodelElementResponseDto, SubmodelPaginationResponseDto, SubmodelRequestDto, SubmodelResponseDto, ValueResponseDto } from "@open-dpp/dto";
import { IdShortPath } from "../domain/submodel-base/submodel-base";

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<AssetAdministrationShellResponseDto>;
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
