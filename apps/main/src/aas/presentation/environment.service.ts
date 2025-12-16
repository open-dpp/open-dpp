import type express from "express";
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { AssetKindType } from "../domain/asset-kind-enum";
import { Environment } from "../domain/environment";
import { Pagination } from "../domain/pagination";
import { PagingResult } from "../domain/paging-result";
import { SubmodelElementSchema } from "../domain/parsing/submodel-base/submodel-element-schema";
import { SubmodelJsonSchema } from "../domain/parsing/submodel-base/submodel-json-schema";
import { IdShortPath, Submodel } from "../domain/submodel-base/submodel";
import { parseSubmodelBaseUnion } from "../domain/submodel-base/submodel-base";
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
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
} from "./dto/submodel-element.dto";
import {
  SubmodelPaginationResponseDto,
  SubmodelPaginationResponseDtoSchema,
  SubmodelRequestDto,
  SubmodelResponseDto,
} from "./dto/submodel.dto";
import { ValueResponseDto, ValueResponseDtoSchema } from "./dto/value-response.dto";

class SubmodelNotPartOfEnvironmentException extends BadRequestException {
  constructor(id: string) {
    super(`Environment has no submodel with id ${id}`);
  }
}

@Injectable()
export class EnvironmentService {
  constructor(private readonly aasRepository: AasRepository, private readonly submodelRepository: SubmodelRepository) {
  }

  async createEnvironmentWithEmptyAas(assetKind: AssetKindType): Promise<Environment> {
    const environment = Environment.create({});
    const aas = environment.addAssetAdministrationShell({ assetKind });
    await this.aasRepository.save(aas);
    return environment;
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

  async addSubmodelToEnvironment(environment: Environment, submodelPlain: SubmodelRequestDto): Promise<SubmodelResponseDto> {
    const submodel = environment.addSubmodel(Submodel.fromPlain(submodelPlain));
    await this.submodelRepository.save(submodel);
    return SubmodelJsonSchema.parse(submodel.toPlain());
  }

  private async findSubmodelByIdOrFail(environment: Environment, submodelId: string): Promise<Submodel> {
    if (environment.submodels.includes(submodelId)) {
      return await this.submodelRepository.findOneOrFail(submodelId);
    }
    else {
      throw new SubmodelNotPartOfEnvironmentException(submodelId);
    }
  }

  async getSubmodelById(environment: Environment, submodelId: string): Promise<SubmodelResponseDto> {
    return SubmodelJsonSchema.parse((await this.findSubmodelByIdOrFail(environment, submodelId)).toPlain());
  }

  async getSubmodelValue(environment: Environment, submodelId: string): Promise<ValueResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const value = submodel.getValueRepresentation();
    return ValueResponseDtoSchema.parse(value);
  }

  async getSubmodelElements(environment: Environment, submodelId: string, pagination: Pagination): Promise<SubmodelElementPaginationResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const pages = pagination.nextPages(submodel.submodelElements.map(e => e.idShort));
    const submodelElements = submodel.submodelElements.filter(e => pages.includes(e.idShort));
    return SubmodelElementPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodelElements }).toPlain());
  }

  async addSubmodelElement(environment: Environment, submodelId: string, submodelElementPlain: SubmodelElementRequestDto): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.addSubmodelElement(parseSubmodelBaseUnion(submodelElementPlain));
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(submodelElement.toPlain());
  }

  async getSubmodelElementById(environment: Environment, submodelId: string, idShortPath: IdShortPath): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.findSubmodelElementOrFail(idShortPath);
    return SubmodelElementSchema.parse(submodelElement.toPlain());
  }

  async getSubmodelElementValue(environment: Environment, submodelId: string, idShortPath: IdShortPath): Promise<ValueResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    return ValueResponseDtoSchema.parse(submodel.getValueRepresentation(idShortPath));
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
