import type express from "express";
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import {
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellPaginationResponseDtoSchema,
  AssetKindType,
  SubmodelElementModificationDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementPaginationResponseDtoSchema,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  SubmodelModificationDto,
  SubmodelPaginationResponseDto,
  SubmodelPaginationResponseDtoSchema,
  SubmodelRequestDto,
  SubmodelResponseDto,
  ValueRequestDto,
  ValueResponseDto,
  ValueSchema,
} from "@open-dpp/dto";
import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { IDigitalProductPassportIdentifiable } from "../domain/digital-product-passport-identifiable";
import { Environment } from "../domain/environment";
import { Submodel } from "../domain/submodel-base/submodel";
import { IdShortPath, parseSubmodelBaseUnion } from "../domain/submodel-base/submodel-base";
import { AasRepository } from "../infrastructure/aas.repository";

import { SubmodelRepository } from "../infrastructure/submodel.repository";

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

  async getAasShells(environment: Environment, pagination: Pagination): Promise<AssetAdministrationShellPaginationResponseDto> {
    const pages = pagination.nextPages(environment.assetAdministrationShells);
    const shells = await Promise.all(pages.map(p => this.aasRepository.findOneOrFail(p)));
    return AssetAdministrationShellPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: shells }).toPlain());
  }

  async getSubmodels(environment: Environment, pagination: Pagination): Promise<SubmodelPaginationResponseDto> {
    const pages = pagination.nextPages(environment.submodels);
    const submodels = await Promise.all(pages.map(p => this.submodelRepository.findOneOrFail(p)));
    return SubmodelPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodels }).toPlain());
  }

  async modifySubmodel(environment: Environment, submodelId: string, modification: SubmodelModificationDto): Promise<SubmodelResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    submodel.modify(modification);
    await this.submodelRepository.save(submodel);
    return SubmodelJsonSchema.parse(submodel.toPlain());
  }

  async addSubmodelToEnvironment(environment: Environment, submodelPlain: SubmodelRequestDto, saveEnvironment: () => Promise<void>): Promise<SubmodelResponseDto> {
    const submodel = environment.addSubmodel(Submodel.fromPlain(submodelPlain));
    await this.submodelRepository.save(submodel);
    // TODO: Add submodel to AAS as reference
    await saveEnvironment();
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
    return ValueSchema.parse(value);
  }

  async getSubmodelElements(environment: Environment, submodelId: string, pagination: Pagination): Promise<SubmodelElementPaginationResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const pages = pagination.nextPages(submodel.submodelElements.map(e => e.idShort));
    const submodelElements = submodel.submodelElements.filter(e => pages.includes(e.idShort));
    return SubmodelElementPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodelElements }).toPlain());
  }

  async addSubmodelElement(environment: Environment, submodelId: string, submodelElementPlain: SubmodelElementRequestDto, idShortPath?: IdShortPath): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.addSubmodelElement(parseSubmodelBaseUnion(submodelElementPlain), idShortPath);
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(submodelElement.toPlain());
  }

  async modifySubmodelElement(environment: Environment, submodelId: string, modification: SubmodelElementModificationDto, idShortPath: IdShortPath): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.modifySubmodelElement(modification, idShortPath);
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(submodelElement.toPlain());
  }

  async modifyValueOfSubmodelElement(environment: Environment, submodelId: string, modification: ValueRequestDto, idShortPath: IdShortPath): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.modifyValueOfSubmodelElement(modification, idShortPath);
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
    return ValueSchema.parse(submodel.getValueRepresentation(idShortPath));
  }
}

export async function checkOwnerShipOfDppIdentifiable<T extends IDigitalProductPassportIdentifiable>(dppIdentifiable: T, authService: AuthService, req: express.Request): Promise<T> {
  const session = await authService.getSession(fromNodeHeaders(req.headers || []));
  if (session?.user.id && await authService.isMemberOfOrganization(session.user.id, dppIdentifiable.getOrganizationId())) {
    return dppIdentifiable;
  }
  else {
    throw new ForbiddenException();
  }
}
