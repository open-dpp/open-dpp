import type express from "express";
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import {
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellPaginationResponseDtoSchema,
  AssetKindType,
  SubmodelElementListJsonSchema,
  SubmodelElementListResponseDto,
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
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { IDigitalProductPassportIdentifiable } from "../domain/digital-product-passport-identifiable";
import { Environment } from "../domain/environment";
import { Submodel } from "../domain/submodel-base/submodel";
import { IdShortPath, ISubmodelElement, parseSubmodelElement } from "../domain/submodel-base/submodel-base";

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
    await saveEnvironment();

    const aas = await this.getFirstAssetAdministrationShell(environment);
    aas.addSubmodel(submodel);

    await this.aasRepository.save(aas);

    return SubmodelJsonSchema.parse(submodel.toPlain());
  }

  async deleteSubmodelFromEnvironment(environment: Environment, submodelId: string, saveEnvironment: () => Promise<void>): Promise<void> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId.toString());
    await this.submodelRepository.deleteById(submodel.id);
    const aas = await this.getFirstAssetAdministrationShell(environment);
    aas.deleteSubmodel(submodel);
    await this.aasRepository.save(aas);
    environment.deleteSubmodel(submodel);
    await saveEnvironment();
  }

  async deleteSubmodelElement(environment: Environment, submodelId: string, idShortPath: IdShortPath): Promise<void> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId.toString());
    submodel.deleteSubmodelElement(idShortPath);
    await this.submodelRepository.save(submodel);
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
    const submodelElement = submodel.addSubmodelElement(parseSubmodelElement(submodelElementPlain), { idShortPath });
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

  async addColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, column: ISubmodelElement, position?: number): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElementList = submodel.addColumn(idShortPath, column, position);
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(modifiedSubmodelElementList.toPlain());
  }

  async modifyColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfColumn: string, modifications: SubmodelModificationDto): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElement = submodel.modifyColumn(idShortPath, idShortOfColumn, modifications);
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(modifiedSubmodelElement.toPlain());
  }

  async deleteColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfColumn: string): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElementList = submodel.deleteColumn(idShortPath, idShortOfColumn);
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain());
  }

  async addRow(environment: Environment, submodelId: string, idShortPath: IdShortPath, position?: number): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElement = submodel.addRow(idShortPath, position);
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(modifiedSubmodelElement.toPlain());
  }

  async deleteRow(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfRow: string): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElementList = submodel.deleteRow(idShortPath, idShortOfRow);
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain());
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

  async copyEnvironment(environment: Environment): Promise<Environment> {
    const submodelsCopy = await Promise.all(environment.submodels.map(async modelId => (await this.findSubmodelByIdOrFail(environment, modelId)).copy()));
    const aasCopy = (await this.getFirstAssetAdministrationShell(environment)).copy(submodelsCopy);

    await this.aasRepository.save(aasCopy);
    await Promise.all(submodelsCopy.map(model => this.submodelRepository.save(model)));

    return Environment.create({
      assetAdministrationShells: [aasCopy.id],
      submodels: submodelsCopy.map(model => model.id),
      conceptDescriptions: environment.conceptDescriptions,
    });
  }

  private async getFirstAssetAdministrationShell(environment: Environment): Promise<AssetAdministrationShell> {
    if (environment.assetAdministrationShells.length === 0) {
      throw new Error("No asset administration shell for environment. Can't add submodel");
    }
    return await this.aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
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
