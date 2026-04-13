import type { ClientSession, Connection } from "mongoose";

import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
  AssetAdministrationShellCreateDto,
  AssetAdministrationShellJsonSchema,
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellPaginationResponseDtoSchema,
  AssetAdministrationShellResponseDto,
  AssetKind,
  Permissions,
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
import { ForbiddenError } from "@open-dpp/exception";

import { DbSessionOptions } from "../../database/query-options";

import { MembersService } from "../../identity/organizations/application/services/members.service";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../../passports/domain/passport";
import { Template } from "../../templates/domain/template";
import { isEmptyObject } from "../../utils";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { IdShortPath } from "../domain/common/id-short-path";
import { LanguageText } from "../domain/common/language-text";
import { ConceptDescription } from "../domain/concept-description";
import { Environment } from "../domain/environment";
import { ExpandedEnvironment } from "../domain/expanded-environment";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { Submodel } from "../domain/submodel-base/submodel";
import { ISubmodelElement, parseSubmodelElement } from "../domain/submodel-base/submodel-base";
import { AasRepository } from "../infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "../infrastructure/concept-description.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import {
  DigitalProductPassportIdentifiableEnvironmentPopulateDecorator,
} from "./digital-product-passport-identifiable-environment-populate-decorator";
import { PopulateOptions } from "./environment-populate-decorator";

class SubmodelNotPartOfEnvironmentException extends BadRequestException {
  constructor(id: string) {
    super(`Environment has no submodel with id ${id}`);
  }
}

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);
  private aasRepository: AasRepository;
  private submodelRepository: SubmodelRepository;
  private conceptDescriptionRepository: ConceptDescriptionRepository;
  private membersService: MembersService;

  constructor(
    aasRepository: AasRepository,
    submodelRepository: SubmodelRepository,
    conceptDescriptionRepository: ConceptDescriptionRepository,
    membersService: MembersService,
    @InjectConnection() private connection: Connection,
  ) {
    this.aasRepository = aasRepository;
    this.submodelRepository = submodelRepository;
    this.conceptDescriptionRepository = conceptDescriptionRepository;
    this.membersService = membersService;
  }

  async loadAbility(environment: Environment, subjet: SubjectAttributes) {
    const security = await this.loadSecurity(environment);
    return security.defineAbilityForSubject(subjet);
  }

  private async loadSecurity(environment: Environment): Promise<Security> {
    const aas = await this.getFirstAssetAdministrationShell(environment);
    return aas.security;
  }

  async createEnvironment(environmentData: { assetAdministrationShells: AssetAdministrationShellCreateDto[] }, isTemplate: boolean): Promise<Environment> {
    const environment = Environment.create({});
    if (environmentData.assetAdministrationShells.length > 1) {
      throw new BadRequestException("Multiple asset administration shells are not supported yet.");
    }
    const assetKind = isTemplate ? AssetKind.Type : AssetKind.Instance;
    const createIdAndAssetInformation = () => {
      const id = randomUUID();
      const assetInformation = AssetInformation.create({ assetKind, globalAssetId: id });
      return { id, assetInformation };
    };

    const assetAdministrationShells = environmentData.assetAdministrationShells.length > 0
      ? environmentData.assetAdministrationShells.map(aas => AssetAdministrationShell.create({
          ...createIdAndAssetInformation(),
          displayName: aas.displayName?.map(LanguageText.fromPlain),
          description: aas.description?.map(LanguageText.fromPlain),
        }))
      : [AssetAdministrationShell.create({ ...createIdAndAssetInformation() })];
    const firstAas = assetAdministrationShells[0];
    await this.aasRepository.save(firstAas);
    environment.addAssetAdministrationShell(firstAas);

    return environment;
  }

  async deletePolicyBySubjectAndObject(
    environment: Environment,
    object: IdShortPath,
    subject: SubjectAttributes,
    administrator: SubjectAttributes,
  ) {
    const aas = await this.getFirstAssetAdministrationShell(environment);
    aas.security.withAdministrator(administrator).deletePolicyBySubjectAndObject(subject, object);
    await this.aasRepository.save(aas);
  }

  async getAasShells(environment: Environment, pagination: Pagination, subject: SubjectAttributes): Promise<AssetAdministrationShellPaginationResponseDto> {
    const pages = pagination.nextPages(environment.assetAdministrationShells);
    const shells = await Promise.all(pages.map(p => this.aasRepository.findOneOrFail(p)));
    const items = shells.map(s => ({
      toPlain: () => {
        const ability = s.security.defineAbilityForSubject(subject);
        return s.toPlain({ ability });
      },
    }));
    return AssetAdministrationShellPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items }).toPlain());
  }

  async modifyAasShell(environment: Environment, aasId: string, modification: AssetAdministrationShellModificationDto, subject: SubjectAttributes): Promise<AssetAdministrationShellResponseDto> {
    const aas = await this.findAssetAdministrationShellByIdOrFail(environment, aasId);
    const ability = aas.security.defineAbilityForSubject(subject);
    aas.modify(modification, { subject, ability });
    await this.aasRepository.save(aas);
    return AssetAdministrationShellJsonSchema.parse(aas.toPlain({ ability }));
  }

  async getSubmodels(environment: Environment, pagination: Pagination, subject: SubjectAttributes): Promise<SubmodelPaginationResponseDto> {
    const pages = pagination.nextPages(environment.submodels);
    const submodels = await Promise.all(pages.map(p => this.submodelRepository.findOneOrFail(p)));
    const ability = await this.loadAbility(environment, subject);
    return SubmodelPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodels }).toPlain({ ability }));
  }

  async modifySubmodel(environment: Environment, submodelId: string, modification: SubmodelModificationDto, subject: SubjectAttributes): Promise<SubmodelResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    submodel.modify(modification, { ability });
    await this.submodelRepository.save(submodel);
    return SubmodelJsonSchema.parse(submodel.toPlain());
  }

  async addSubmodelToEnvironment(environment: Environment, submodelPlain: SubmodelRequestDto, saveEnvironment: (options: DbSessionOptions) => Promise<void>): Promise<SubmodelResponseDto> {
    const session = await this.connection.startSession();
    let result: SubmodelResponseDto;
    try {
      await session.withTransaction(async () => {
        const options = { session };
        const submodel = environment.addSubmodel(Submodel.fromPlain(submodelPlain));
        await saveEnvironment(options);
        await this.submodelRepository.save(submodel, options);

        const aas = await this.getFirstAssetAdministrationShell(environment);
        aas.addSubmodel(submodel);
        await this.aasRepository.save(aas, options);

        result = SubmodelJsonSchema.parse(submodel.toPlain());
      });
      return result!;
    }
    finally {
      await session.endSession();
    }
  }

  async deleteSubmodelFromEnvironment(environment: Environment, submodelId: string, saveEnvironment: (options: DbSessionOptions) => Promise<void>, subject: SubjectAttributes): Promise<void> {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const options = { session };
        const aas = await this.getFirstAssetAdministrationShell(environment);
        const ability = aas.security.defineAbilityForSubject(subject);
        const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);

        if (!ability.can(Permissions.Delete, IdShortPath.create({ path: submodel.idShort }))) {
          throw new ForbiddenError(`Missing permissions to delete element ${submodel.idShort}.`);
        }
        await this.submodelRepository.deleteById(submodel.id, options);

        aas.deleteSubmodel(submodel);
        await this.aasRepository.save(aas, options);
        environment.deleteSubmodel(submodel);
        await saveEnvironment(options);
      });
    }
    finally {
      await session.endSession();
    }
  }

  async deleteSubmodelElement(environment: Environment, submodelId: string, idShortPath: IdShortPath, subject: SubjectAttributes): Promise<void> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId.toString());
    const aas = await this.getFirstAssetAdministrationShell(environment);
    const ability = aas.security.defineAbilityForSubject(subject);
    submodel.deleteSubmodelElement(
      idShortPath,
      { ability, onDelete: s => aas.security.deletePoliciesByObjectPath(s.getIdShortPath()) },
    );
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.submodelRepository.save(submodel, { session });
        await this.aasRepository.save(aas, { session });
      });
    }
    finally {
      await session.endSession();
    }
  }

  private async findSubmodelByIdOrFail(environment: Environment, submodelId: string): Promise<Submodel> {
    if (environment.submodels.includes(submodelId)) {
      return await this.submodelRepository.findOneOrFail(submodelId);
    }
    else {
      throw new SubmodelNotPartOfEnvironmentException(submodelId);
    }
  }

  public async findAssetAdministrationShellByIdOrFail(environment: Environment, aasId: string): Promise<AssetAdministrationShell> {
    if (environment.assetAdministrationShells.includes(aasId)) {
      return await this.aasRepository.findOneOrFail(aasId);
    }
    else {
      throw new BadRequestException(`Environment has no asset administration shell with id ${aasId}`);
    }
  }

  async getSubmodelById(environment: Environment, submodelId: string, subject: SubjectAttributes): Promise<SubmodelResponseDto> {
    const ability = await this.loadAbility(environment, subject);
    const result = (await this.findSubmodelByIdOrFail(environment, submodelId)).toPlain({ ability });
    if (isEmptyObject(result)) {
      throw new ForbiddenError();
    }
    return SubmodelJsonSchema.parse(result);
  }

  async getSubmodelValue(environment: Environment, submodelId: string, subject: SubjectAttributes): Promise<ValueResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);

    const ability = await this.loadAbility(environment, subject);
    const result = submodel.getValueRepresentation({ options: { ability } });

    return ValueSchema.parse(result);
  }

  async getSubmodelElements(environment: Environment, submodelId: string, pagination: Pagination, subject: SubjectAttributes): Promise<SubmodelElementPaginationResponseDto> {
    const ability = await this.loadAbility(environment, subject);
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const pages = pagination.nextPages(submodel.submodelElements.map(e => e.idShort));
    const submodelElements = submodel.submodelElements.filter(e => pages.includes(e.idShort));
    return SubmodelElementPaginationResponseDtoSchema.parse(PagingResult.create({ pagination, items: submodelElements }).toPlain({
      ability,
    }));
  }

  async addSubmodelElement(environment: Environment, submodelId: string, submodelElementPlain: SubmodelElementRequestDto, subject: SubjectAttributes, idShortPath?: IdShortPath): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    const submodelElement = submodel.addSubmodelElement(parseSubmodelElement(submodelElementPlain), { idShortPath, ability });
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(submodelElement.toPlain());
  }

  async modifySubmodelElement(environment: Environment, submodelId: string, modification: SubmodelElementModificationDto, idShortPath: IdShortPath, subject: SubjectAttributes): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    const submodelElement = submodel.modifySubmodelElement(modification, idShortPath, { ability });
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(submodelElement.toPlain({ ability }));
  }

  async modifyValueOfSubmodelElement(environment: Environment, submodelId: string, modification: ValueRequestDto, idShortPath: IdShortPath, subject: SubjectAttributes): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    const submodelElement = submodel.modifyValueOfSubmodelElement(modification, idShortPath, { ability });
    await this.submodelRepository.save(submodel);
    return SubmodelElementSchema.parse(submodelElement.toPlain({ ability }));
  }

  async addColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, column: ISubmodelElement, subject: SubjectAttributes, position?: number): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    const modifiedSubmodelElementList = submodel.addColumn(idShortPath, column, { position, ability });
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain());
  }

  async modifyColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfColumn: string, modifications: SubmodelElementModificationDto, subject: SubjectAttributes): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    const modifiedSubmodelElement = submodel.modifyColumn(idShortPath, idShortOfColumn, modifications, { ability });
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElement.toPlain({ ability }));
  }

  async deleteColumn(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfColumn: string, subject: SubjectAttributes): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const aas = await this.getFirstAssetAdministrationShell(environment);
    const ability = aas.security.defineAbilityForSubject(subject);
    const modifiedSubmodelElementList = submodel.deleteColumn(
      idShortPath,
      idShortOfColumn,
      { ability, onDelete: s => aas.security.deletePoliciesByObjectPath(s.getIdShortPath()) },
    );
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.submodelRepository.save(submodel, { session });
        await this.aasRepository.save(aas, { session });
      });
      return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain({ ability }));
    }
    finally {
      await session.endSession();
    }
  }

  async addRow(environment: Environment, submodelId: string, idShortPath: IdShortPath, subject: SubjectAttributes, position?: number): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);
    const modifiedSubmodelElement = submodel.addRow(idShortPath, { position, ability });
    await this.submodelRepository.save(submodel);
    return SubmodelElementListJsonSchema.parse(modifiedSubmodelElement.toPlain());
  }

  async deleteRow(environment: Environment, submodelId: string, idShortPath: IdShortPath, idShortOfRow: string, subject: SubjectAttributes): Promise<SubmodelElementListResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const aas = await this.getFirstAssetAdministrationShell(environment);
    const ability = aas.security.defineAbilityForSubject(subject);
    const modifiedSubmodelElementList = submodel.deleteRow(
      idShortPath,
      idShortOfRow,
      { ability, onDelete: s => aas.security.deletePoliciesByObjectPath(s.getIdShortPath()) },
    );
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.submodelRepository.save(submodel, { session });
        await this.aasRepository.save(aas, { session });
      });
      return SubmodelElementListJsonSchema.parse(modifiedSubmodelElementList.toPlain({ ability }));
    }
    finally {
      await session.endSession();
    }
  }

  async getSubmodelElementById(environment: Environment, submodelId: string, idShortPath: IdShortPath, subject: SubjectAttributes): Promise<SubmodelElementResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const submodelElement = submodel.findSubmodelElementOrFail(idShortPath);
    const ability = await this.loadAbility(environment, subject);
    const result = submodelElement.toPlain({ ability });
    if (isEmptyObject(result)) {
      throw new ForbiddenError();
    }
    return SubmodelElementSchema.parse(result);
  }

  async getSubmodelElementValue(environment: Environment, submodelId: string, idShortPath: IdShortPath, subject: SubjectAttributes): Promise<ValueResponseDto> {
    const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
    const ability = await this.loadAbility(environment, subject);

    const result = submodel.getValueRepresentation({ idShortPath, options: { ability } });
    if (result === undefined || isEmptyObject(result)) {
      throw new ForbiddenError();
    }
    return ValueSchema.parse(result);
  }

  async loadExpandedEnvironment(environment: Environment): Promise<ExpandedEnvironment> {
    const [shellMap, submodelMap, conceptDescriptionMap] = await Promise.all([
      this.aasRepository.findByIds(environment.assetAdministrationShells),
      this.submodelRepository.findByIds(environment.submodels),
      this.conceptDescriptionRepository.findByIds(environment.conceptDescriptions),
    ]);

    try {
      return ExpandedEnvironment.fromEnvironment(environment, shellMap, submodelMap, conceptDescriptionMap);
    }
    catch (e) {
      this.logger.error(e instanceof Error ? e.message : e);
      throw e;
    }
  }

  async persistImportedEnvironment(
    shells: AssetAdministrationShell[],
    submodels: Submodel[],
    conceptDescriptions: ConceptDescription[],
    saveEntity: (options: DbSessionOptions) => Promise<void>,
  ): Promise<void> {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const options = { session };
        for (const conceptDescription of conceptDescriptions) {
          await this.conceptDescriptionRepository.save(conceptDescription, options);
        }
        for (const submodel of submodels) {
          await this.submodelRepository.save(submodel, options);
        }
        for (const shell of shells) {
          await this.aasRepository.save(shell, options);
        }
        await saveEntity(options);
      });
    }
    finally {
      await session.endSession();
    }
  }

  async populateEnvironmentForPagingResult(pagingResult: PagingResult<Passport | Template>, populateOptions: PopulateOptions, subject: SubjectAttributes) {
    const ability = await this.loadAbility(pagingResult.items[0].environment, subject);
    const populatedItems = await Promise.all(pagingResult.items.map(
      async i => await new DigitalProductPassportIdentifiableEnvironmentPopulateDecorator(
        i,
        this.aasRepository,
        this.submodelRepository,
        ability,
      ).populate(populateOptions),
    ));
    return PagingResult.create({ pagination: pagingResult.pagination, items: populatedItems });
  }

  async copyEnvironment(environment: Environment): Promise<Environment> {
    const submodelsCopy: Submodel[] = [];
    for (const submodelId of environment.submodels) {
      const submodel = await this.findSubmodelByIdOrFail(environment, submodelId);
      const copy = submodel.copy();
      if (copy) {
        submodelsCopy.push(copy);
      }
    }
    const aasCopy = (await this.getFirstAssetAdministrationShell(environment)).copy(submodelsCopy);
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.aasRepository.save(aasCopy);
        await Promise.all(submodelsCopy.map(model => this.submodelRepository.save(model)));
      });
    }
    finally {
      await session.endSession();
    }
    return Environment.create({
      assetAdministrationShells: [aasCopy.id],
      submodels: submodelsCopy.map(model => model.id),
      conceptDescriptions: environment.conceptDescriptions,
    });
  }

  async deleteEnvironment(environment: Environment, session: ClientSession): Promise<void> {
    for (const aasId of environment.assetAdministrationShells) {
      await this.aasRepository.deleteById(aasId, { session });
    }
    for (const submodelId of environment.submodels) {
      await this.submodelRepository.deleteById(submodelId, { session });
    }
    for (const conceptDescriptionId of environment.conceptDescriptions) {
      await this.conceptDescriptionRepository.deleteById(conceptDescriptionId, { session });
    }
  }

  private async getFirstAssetAdministrationShell(environment: Environment): Promise<AssetAdministrationShell> {
    if (environment.assetAdministrationShells.length === 0) {
      throw new Error("No asset administration shell for environment. Can't add submodel");
    }
    return await this.aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
  }
}
