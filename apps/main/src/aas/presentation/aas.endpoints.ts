import type express from "express";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";

export interface IAasReadEndpoints {
  getShells: (id: string, req: express.Request) => Promise<AssetAdministrationShellResponseDto>;
}
