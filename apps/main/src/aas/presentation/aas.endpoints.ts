import type express from "express";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";
import { SubmodelElementPaginationResponseDto } from "./dto/submodel-element.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "./dto/submodel.dto";

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<AssetAdministrationShellResponseDto>;
  getSubmodels: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (id: string, submodelId: string, req: express.Request) => Promise<SubmodelResponseDto>;
  getSubmodelElements: (id: string, submodelId: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<SubmodelElementPaginationResponseDto>;
}
