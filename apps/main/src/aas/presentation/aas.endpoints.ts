import type express from "express";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";

export interface IAasReadEndpoints {
  getShells: (id: string, limit: number | undefined, cursor: string | undefined, req: express.Request) => Promise<AssetAdministrationShellResponseDto>;
}
