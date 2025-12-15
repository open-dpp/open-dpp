import type express from "express";
import { IdShortPath } from "../domain/submodel-base/submodel";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";
import { SubmodelElementPaginationResponseDto, SubmodelElementResponseDto } from "./dto/submodel-element.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "./dto/submodel.dto";
import { ValueResponseDto } from "./dto/value-response.dto";

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
