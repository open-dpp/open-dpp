import type { Connection } from "mongoose";

import { randomUUID } from "node:crypto";
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
  AssetAdministrationShellCreateDto,
  AssetAdministrationShellJsonSchema,
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellPaginationResponseDtoSchema,
  AssetAdministrationShellResponseDto,
  AssetKind,
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
import { DbSessionOptions } from "../../database/query-options";
import { Session } from "../../identity/auth/domain/session";
import { MembersService } from "../../identity/organizations/application/services/members.service";

import { Pagination } from "../../pagination/pagination";

import { PagingResult } from "../../pagination/paging-result";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { LanguageText } from "../domain/common/language-text";
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
  private aasRepository: AasRepository;
  private submodelRepository: SubmodelRepository;
  private membersService: MembersService;

  constructor(
    aasRepository: AasRepository,
    submodelRepository: SubmodelRepository,
    membersService: MembersService,
    @InjectConnection() private connection: Connection,
  ) {
    this.aasRepository = aasRepository;
    this.submodelRepository = submodelRepository;
    this.membersService = membersService;
  }

  async createEnvironment(environmentData: { assetAdministrationShells: AssetAdministrationShellCreateDto[] }, isTemplate: boolean): Promise<Environment> {
    const environment = Environment.create({});
    const assetKind = isTemplate ? AssetKind.Type : AssetKind.Instance;
    const id = randomUUID();
    const assetInformation = AssetInformation.create({ assetKind, globalAssetId: id });
    const assetAdministrationShells = environmentData.assetAdministrationShells.length > 0
      ? environmentData.assetAdministrationShells.map(aas => AssetAdministrationShell.create({
          id,
          displayName: aas.displayName?.map(LanguageText.fromPlain),
          description: aas.description?.map(LanguageText.fromPlain),
          assetInformation,
        }))
      : [AssetAdministrationShell.create({ id, assetInformation })];
    for (const aas of assetAdministrationShells) {
      await this.aasRepository.save(aas);
      environment.addAssetAdministrationShell(aas);
    }

    return environment;
  }

  async getAasShells(environment: Environment, pagination: Pagination): Promise<AssetAdministrationShellPaginationResponseDto> {
    const pages = pagination.nextPages(environment.assetAdministrationShells);
    const shells = await Promise.all(pages.map(p => this.aasRepository.findOneOrFail(p)));
    return AssetAdministrationShellPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: shells }).toPlain());
  }

  async modifyAasShell(environment: Environment, aasId: string, modification: AssetAdministrationShellModificationDto): Promise<AssetAdministrationShellResponseDto> {
    const aas = await this.findAssetAdministrationShellByIdOrFail(environment, aasId);
    aas.modify(modification);
    await this.aasRepository.save(aas);
    return AssetAdministrationShellJsonSchema.parse(aas.toPlain());
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

  async addSubmodelToEnvironment(environment: Environment, submodelPlain: SubmodelRequestDto, saveEnvironment: (options: DbSessionOptions) => Promise<void>): Promise<SubmodelResponseDto> {
    const session = await this.connection.startSession();
    const options = { session };
    try {
      session.startTransaction();
      const submodel = environment.addSubmodel(Submodel.fromPlain(submodelPlain));
      await saveEnvironment(options);
      await this.submodelRepository.save(submodel, options);

      const aas = await this.getFirstAssetAdministrationShell(environment);
      aas.addSubmodel(submodel);
      await this.aasRepository.save(aas, options);

      const result = SubmodelJsonSchema.parse(submodel.toPlain());
      await session.commitTransaction();
      return result;
    }
    catch (e) {
      await session.abortTransaction();
      throw e;
    }
    finally {
      await session.endSession();
    }
  }

  async deleteSubmodelFromEnvironment(environment: Environment, submodelId: string, saveEnvironment: (options: DbSessionOptions) => Promise<void>): Promise<void> {
    const session = await this.connection.startSession();
    const options = { session };
    try {
      session.startTransaction();
      const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
      await this.submodelRepository.deleteById(submodel.id, options);
      const aas = await this.getFirstAssetAdministrationShell(environment);
      aas.deleteSubmodel(submodel);
      await this.aasRepository.save(aas, options);
      environment.deleteSubmodel(submodel);
      await saveEnvironment(options);
      await session.commitTransaction();
    }
    catch (e) {
      await session.abortTransaction();
      throw e;
    }
    finally {
      await session.endSession();
    }
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

  private async findAssetAdministrationShellByIdOrFail(environment: Environment, aasId: string): Promise<AssetAdministrationShell> {
    if (environment.assetAdministrationShells.includes(aasId)) {
      return await this.aasRepository.findOneOrFail(aasId);
    }
    else {
      throw new BadRequestException(`Environment has no asset administration shell with id ${aasId}`);
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

  async addColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, column: ISubmodelElement, position?: number): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElementList = submodel.addColumn(idShortPath, column, position);
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain());
  }

  async modifyColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfColumn: string, modifications: SubmodelElementModificationDto): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElement = submodel.modifyColumn(idShortPath, idShortOfColumn, modifications);
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElement.toPlain());
  }

  async deleteColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfColumn: string): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElementList = submodel.deleteColumn(idShortPath, idShortOfColumn);
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain());
  }

  async addRow(environment: Environment, submodelId: string, idShortPath: IdShortPath, position?: number): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const modifiedSubmodelElement = submodel.addRow(idShortPath, position);
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElement.toPlain());
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

  /**
   * Resolves all shell and submodel IDs of an environment to full plain objects.
   * Can be used to populate the environment of a passport or template.
   * Missing IDs are skipped (no throw).
   */
  async getFullEnvironmentAsPlain(environment: Environment): Promise<{
    assetAdministrationShells: Array<Record<string, unknown>>;
    submodels: Array<Record<string, unknown>>;
    conceptDescriptions: Array<string>;
  }> {
    const shellIds = environment.assetAdministrationShells;
    const submodelIds = environment.submodels;

    const [shellResults, submodelResults] = await Promise.all([
      Promise.all(shellIds.map(id => this.aasRepository.findOne(id))),
      Promise.all(submodelIds.map(id => this.submodelRepository.findOne(id))),
    ]);

    const shells = shellResults.filter((aas): aas is AssetAdministrationShell => aas != null);
    const submodels = submodelResults.filter((s): s is Submodel => s != null);

    return {
      assetAdministrationShells: shells.map(s => s.toPlain()),
      submodels: submodels.map(s => s.toPlain()),
      conceptDescriptions: environment.conceptDescriptions,
    };
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
