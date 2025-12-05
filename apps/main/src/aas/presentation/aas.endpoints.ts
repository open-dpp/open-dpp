import type express from "express";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "./dto/submodel.dto";

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<AssetAdministrationShellResponseDto>;
  getSubmodels: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<SubmodelPaginationResponseDto>;
  getSubmodelById: (id: string, submodelId: string, req: express.Request) => Promise<SubmodelResponseDto>;
}
