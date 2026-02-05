import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";

import { AssetAdministrationShellPaginationResponseDto, AssetAdministrationShellPaginationResponseDtoSchema, AssetKindType, SubmodelElementPaginationResponseDto, SubmodelElementPaginationResponseDtoSchema, SubmodelElementRequestDto, SubmodelElementResponseDto, SubmodelElementSchema, SubmodelJsonSchema, SubmodelPaginationResponseDto, SubmodelPaginationResponseDtoSchema, SubmodelRequestDto, SubmodelResponseDto, ValueResponseDto, ValueResponseDtoSchema } from "@open-dpp/dto";
import { Session } from "../../identity/auth/domain/session";
import { MembersService } from "../../identity/organizations/application/services/members.service";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
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
  private aasRepository: AasRepository;
  private submodelRepository: SubmodelRepository;
  private membersService: MembersService;

  constructor(
    aasRepository: AasRepository,
    submodelRepository: SubmodelRepository,
    membersService: MembersService,
  ) {
    this.aasRepository = aasRepository;
    this.submodelRepository = submodelRepository;
    this.membersService = membersService;
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

  async addSubmodelToEnvironment(environment: Environment, submodelPlain: SubmodelRequestDto, saveEnvironment: () => Promise<void>): Promise<SubmodelResponseDto> {
    const submodel = environment.addSubmodel(Submodel.fromPlain(submodelPlain));
    await this.submodelRepository.save(submodel);
    await saveEnvironment();

    const aas = await this.getFirstAssetAdministrationShell(environment);
    aas.addSubmodel(submodel);

    await this.aasRepository.save(aas);

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

  async addSubmodelElement(environment: Environment, submodelId: string, submodelElementPlain: SubmodelElementRequestDto, idShortPath?: IdShortPath): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.addSubmodelElement(parseSubmodelBaseUnion(submodelElementPlain), idShortPath);
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

  async checkOwnerShipOfDppIdentifiable<T extends IDigitalProductPassportIdentifiable>(dppIdentifiable: T, session: Session): Promise<T> {
    const isMember = await this.membersService.isMemberOfOrganization(session.userId, dppIdentifiable.getOrganizationId());
    if (session.userId && isMember) {
      return dppIdentifiable;
    }
    else {
      throw new ForbiddenException();
    }
  }
}
