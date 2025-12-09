import type express from "express";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { Environment } from "../domain/environment";
import { Pagination } from "../domain/pagination";
import { PagingResult } from "../domain/paging-result";
import { SubmodelBaseUnionSchema } from "../domain/parsing/submodel-base/submodel-base-union-schema";
import { SubmodelJsonSchema } from "../domain/parsing/submodel-base/submodel-json-schema";
import { IdShortPath } from "../domain/submodel-base/submodel";
import { AasRepository } from "../infrastructure/aas.repository";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../infrastructure/digital-product-passport-identifiable.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import {
  AssetAdministrationShellPaginationResponseDtoSchema,
  AssetAdministrationShellResponseDto,
} from "./dto/asset-administration-shell.dto";
import {
  SubmodelElementPaginationResponseDto,
  SubmodelElementPaginationResponseDtoSchema,
  SubmodelElementResponseDto,
} from "./dto/submodel-element.dto";
import {
  SubmodelPaginationResponseDto,
  SubmodelPaginationResponseDtoSchema,
  SubmodelResponseDto,
} from "./dto/submodel.dto";

class SubmodelNotPartOfEnvironmentException extends BadRequestException {
  constructor(id: string) {
    super(`Environment has no submodel with id ${id}`);
  }
}

class SubmodelElementNotFoundException extends NotFoundException {
  constructor(idShortPath: IdShortPath) {
    super(`Submodel element with id ${idShortPath.toString()} not found`);
  }
}

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
      throw new SubmodelNotPartOfEnvironmentException(submodelId);
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
      throw new SubmodelNotPartOfEnvironmentException(submodelId);
    }
  }

  async getSubmodelElementById(environment: Environment, submodelId: string, idShortPath: IdShortPath): Promise<SubmodelElementResponseDto> {
    if (environment.submodels.includes(submodelId)) {
      const submodel = await this.submodelRepository.findOneOrFail(submodelId);
      const submodelElement = submodel.findSubmodelElement(idShortPath);
      if (!submodelElement) {
        throw new SubmodelElementNotFoundException(idShortPath);
      }
      return SubmodelBaseUnionSchema.parse(submodelElement.toPlain());
    }
    else {
      throw new SubmodelNotPartOfEnvironmentException(submodelId);
    }
  }
}

export async function loadEnvironmentAndCheckOwnership(authService: AuthService, envRepository: IDigitalProductPassportIdentifiableRepository, environmentId: string, req: express.Request): Promise<Environment> {
  const dppIdentifiable = await envRepository.findOneOrFail(environmentId);
  const session = await authService.getSession(fromNodeHeaders(req.headers || []));
  if (session?.user.id && await authService.isMemberOfOrganization(session.user.id, dppIdentifiable.getOrganizationId())) {
    return dppIdentifiable.getEnvironment();
  }
  else {
    throw new ForbiddenException();
  }
}
