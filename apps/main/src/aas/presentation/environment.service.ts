import { Injectable } from "@nestjs/common";
import { Environment } from "../domain/environment";

import { Pagination } from "../domain/pagination";
import { PagingResult } from "../domain/paging-result";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import {
  AssetAdministrationShellResponseDto,
  AssetAdministrationShellResponseDtoSchema,
} from "./dto/asset-administration-shell.dto";

@Injectable()
export class EnvironmentService {
  constructor(private readonly aasRepository: AasRepository, private readonly submodelRepository: SubmodelRepository) {
  }

  async getAasShells(environment: Environment, pagination: Pagination): Promise<AssetAdministrationShellResponseDto> {
    const pages = pagination.nextPages(environment.assetAdministrationShells);
    const shells = await Promise.all(pages.map(p => this.aasRepository.findOneOrFail(p)));
    return AssetAdministrationShellResponseDtoSchema.parse(PagingResult.create({ pagination, items: shells }).toPlain());
  }
}
