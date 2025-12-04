import type express from "express";
import { Controller, Param, Req } from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../domain/pagination";
import { TemplateRepository } from "../infrastructure/template.repository";
import { ApiGetShells, loadEnvironmentAndCheckOwnership } from "./aas.decorators";
import { IAasReadEndpoints } from "./aas.endpoints";
import {
  AssetAdministrationShellResponseDto,
} from "./dto/asset-administration-shell.dto";
import { EnvironmentService } from "./environment.service";

const idDescription = "The id of the template";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly templateRepository: TemplateRepository) {
  }

  @ApiGetShells(idDescription)
  async getShells(@Param("id") id: string, @Req() req: express.Request): Promise<AssetAdministrationShellResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit: 1 });
    return await this.environmentService.getAasShells(environment, pagination);
  }
}
