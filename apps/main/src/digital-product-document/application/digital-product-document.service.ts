import { ForbiddenException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { IDigitalProductDocumentStatusChangeable } from "../domain/digital-product-document-status";
import {
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellResponseDto,
  DeletePolicyDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  type SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  type SubmodelRequestDto,
  SubmodelResponseDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { DbSessionOptions } from "../../database/query-options";
import {
  DigitalProductDocumentEntity,
  IDigitalProductDocumentRepository,
} from "../infrastructure/digital-product-document-repository.interface";
import { parseSubmodelElement } from "../../aas/domain/submodel-base/submodel-base";

export class DigitalProductDocumentService<T extends DigitalProductDocumentEntity> {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly digitalProductDocRepository: IDigitalProductDocumentRepository<T>,
  ) {}

  async createSubmodel(
    organizationId: string,
    id: string,
    body: SubmodelRequestDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addSubmodelToEnvironment(
      item.getEnvironment(),
      body,
      this.saveEnvironmentCallback(item),
    );
  }

  async addColumnToSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(
      item.getEnvironment(),
      submodelId,
      idShortPath,
      column,
      subject,
      position,
    );
  }

  async addRowToSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    position: number | undefined,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addRow(
      item.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
      position,
    );
  }

  async createSubmodelElement(
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addSubmodelElement(
      item.getEnvironment(),
      submodelId,
      body,
      subject,
    );
  }

  async createSubmodelElementAtIdShortPath(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addSubmodelElement(
      item.getEnvironment(),
      submodelId,
      body,
      subject,
      idShortPath,
    );
  }

  async modifyShell(
    organizationId: string,
    id: string,
    aasId: string,
    body: AssetAdministrationShellModificationDto,
    subject: SubjectAttributes,
  ): Promise<AssetAdministrationShellResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyAasShell(
      item.getEnvironment(),
      aasId,
      body,
      subject,
    );
  }

  async modifySubmodel(
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelModificationDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifySubmodel(
      item.getEnvironment(),
      submodelId,
      body,
      subject,
    );
  }

  async modifyValueOfSubmodel(
    organizationId: string,
    id: string,
    submodelId: string,
    body: ValueRequestDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyValueOfSubmodel(
      item.getEnvironment(),
      submodelId,
      body,
      subject,
    );
  }

  async modifyColumnOfSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    body: SubmodelModificationDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyColumn(
      item.getEnvironment(),
      submodelId,
      idShortPath,
      idShortOfColumn,
      body,
      subject,
    );
  }

  async modifySubmodelElement(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementModificationDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifySubmodelElement(
      item.getEnvironment(),
      submodelId,
      body,
      idShortPath,
      subject,
    );
  }

  async deleteSubmodel(
    organizationId: string,
    id: string,
    submodelId: string,
    subject: SubjectAttributes,
  ): Promise<void> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    await this.environmentService.deleteSubmodelFromEnvironment(
      item.getEnvironment(),
      submodelId,
      this.saveEnvironmentCallback(item),
      subject,
    );
  }

  async deleteSubmodelElement(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    subject: SubjectAttributes,
  ): Promise<void> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    await this.environmentService.deleteSubmodelElement(
      item.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }

  async deleteColumnFromSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.deleteColumn(
      item.getEnvironment(),
      submodelId,
      idShortPath,
      idShortOfColumn,
      subject,
    );
  }

  async deletePolicyBySubjectAndObject(
    organizationId: string,
    id: string,
    body: DeletePolicyDto,
    administrator: SubjectAttributes,
  ): Promise<void> {
    const subject = SubjectAttributes.fromPlain(body.subject);
    const object = IdShortPath.create({ path: body.object });
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      administrator,
      organizationId,
    );
    this.archiveGuard(item);
    await this.environmentService.deletePolicyBySubjectAndObject(
      item.getEnvironment(),
      object,
      subject,
      administrator,
    );
  }

  async deleteRowFromSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfRow: string,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.deleteRow(
      item.getEnvironment(),
      submodelId,
      idShortPath,
      idShortOfRow,
      subject,
    );
  }

  async modifySubmodelElementValue(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: ValueRequestDto,
    subject: SubjectAttributes,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyValueOfSubmodelElement(
      item.getEnvironment(),
      submodelId,
      body,
      idShortPath,
      subject,
    );
  }

  public async loadDigitalProductDocumentAndCheckOwnership(
    id: string,
    subject: SubjectAttributes,
    organizationId: string,
  ): Promise<T> {
    const item = await this.digitalProductDocRepository.findOneOrFail(id);
    if (item.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return item;
  }

  private archiveGuard(item: IDigitalProductDocumentStatusChangeable): void {
    if (item.isArchived()) {
      throw new ValueError("Cannot modify an archived digital product document");
    }
  }

  public saveEnvironmentCallback(item: T) {
    return async (options: DbSessionOptions) => {
      await this.digitalProductDocRepository.save(item, options);
    };
  }
}
