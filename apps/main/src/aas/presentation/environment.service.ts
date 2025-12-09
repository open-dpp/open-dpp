import { BadRequestException, Injectable } from "@nestjs/common";
import { Environment } from "../domain/environment";

import { Pagination } from "../domain/pagination";
import { PagingResult } from "../domain/paging-result";
import { SubmodelJsonSchema } from "../domain/parsing/submodel-base/submodel-json-schema";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import {
  AssetAdministrationShellPaginationResponseDtoSchema,
  AssetAdministrationShellResponseDto,
} from "./dto/asset-administration-shell.dto";
import {
  SubmodelElementPaginationResponseDto,
  SubmodelElementPaginationResponseDtoSchema,
} from "./dto/submodel-element.dto";
import {
  SubmodelPaginationResponseDto,
  SubmodelPaginationResponseDtoSchema,
  SubmodelResponseDto,
} from "./dto/submodel.dto";

@Injectable()
export class EnvironmentService {
  constructor(private readonly aasRepository: AasRepository, private readonly submodelRepository: SubmodelRepository) {
  }

  async getAasShells(environment: Environment, pagination: Pagination): Promise<AssetAdministrationShellResponseDto> {
    const pages = pagination.nextPages(environment.assetAdministrationShells);
    const shells = await Promise.all(pages.map(p => this.aasRepository.findOneOrFail(p)));
    return AssetAdministrationShellPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: shells }).toPlain());
  }

  async getSubmodels(environment: Environment, pagination: Pagination): Promise<SubmodelPaginationResponseDto> {
    const pages = pagination.nextPages(environment.submodels);
    const submodels = await Promise.all(pages.map(p => this.submodelRepository.findOneOrFail(p)));
    return SubmodelPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodels }).toPlain());
  }

  async getSubmodelById(environment: Environment, submodelId: string): Promise<SubmodelResponseDto> {
    if (environment.submodels.includes(submodelId)) {
      return SubmodelJsonSchema.parse((await this.submodelRepository.findOneOrFail(submodelId)).toPlain());
    }
    else {
      throw new BadRequestException(`Environment has no submodel with id ${submodelId}`);
    }
  }

  async getSubmodelElements(environment: Environment, submodelId: string, pagination: Pagination): Promise<SubmodelElementPaginationResponseDto> {
    if (environment.submodels.includes(submodelId)) {
      const submodel = await this.submodelRepository.findOneOrFail(submodelId);
      const pages = pagination.nextPages(submodel.submodelElements.map(e => e.idShort));
      const submodelElements = submodel.submodelElements.filter(e => pages.includes(e.idShort));
      return SubmodelElementPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodelElements }).toPlain());
    }
    else {
      throw new BadRequestException(`Environment has no submodel with id ${submodelId}`);
    }
  }
}
