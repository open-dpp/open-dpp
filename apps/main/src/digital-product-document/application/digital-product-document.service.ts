import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { EnvironmentService, UserContext } from "../../aas/presentation/environment.service";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Response } from "express";

import {
  ActivityPaginationDtoSchema,
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
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { Pagination } from "../../pagination/pagination";
import archiver, { Archiver } from "archiver";
import { IDigitalProductDocumentStatusChangeable } from "../domain/digital-product-document-status";
import { Period } from "../../time/period";

export class DigitalProductDocumentService<T extends DigitalProductDocumentEntity> {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly digitalProductDocRepository: IDigitalProductDocumentRepository<T>,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async createSubmodel(
    organizationId: string,
    id: string,
    body: SubmodelRequestDto,
    userContext: UserContext,
  ): Promise<SubmodelResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addSubmodelToEnvironment(
      id,
      item.getEnvironment(),
      body,
      this.saveEnvironmentCallback(item),
      userContext,
    );
  }

  async addColumnToSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    userContext: UserContext,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      column,
      userContext,
      position,
    );
  }

  async addRowToSubmodelElementList(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    position: number | undefined,
    userContext: UserContext,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addRow(
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      userContext,
      position,
    );
  }

  async createSubmodelElement(
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    userContext: UserContext,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addSubmodelElement(
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
    );
  }

  async createSubmodelElementAtIdShortPath(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementRequestDto,
    userContext: UserContext,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addSubmodelElement(
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
      idShortPath,
    );
  }

  async modifyShell(
    organizationId: string,
    id: string,
    aasId: string,
    body: AssetAdministrationShellModificationDto,
    userContext: UserContext,
  ): Promise<AssetAdministrationShellResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyAasShell(
      id,
      item.getEnvironment(),
      aasId,
      body,
      userContext,
    );
  }

  async modifySubmodel(
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelModificationDto,
    userContext: UserContext,
  ): Promise<SubmodelResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifySubmodel(
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
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
    userContext: UserContext,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyColumn(
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      idShortOfColumn,
      body,
      userContext,
    );
  }

  async modifySubmodelElement(
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    body: SubmodelElementModificationDto,
    userContext: UserContext,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifySubmodelElement(
      id,
      item.getEnvironment(),
      submodelId,
      body,
      idShortPath,
      userContext,
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
    userContext: UserContext,
  ): Promise<SubmodelElementResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyValueOfSubmodelElement(
      id,
      item.getEnvironment(),
      submodelId,
      body,
      idShortPath,
      userContext,
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

  async getActivities(
    organizationId: string,
    id: string,
    subject: SubjectAttributes,
    startDate: string | undefined,
    endDate: string | undefined,
    limit: number = 10,
    cursor: string | undefined,
    ascending: boolean = false,
  ) {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const period =
      startDate || endDate ? Period.fromIso({ start: startDate, end: endDate }) : undefined;
    const pagination = Pagination.create({ limit, cursor });
    return ActivityPaginationDtoSchema.parse(
      (
        await this.activityRepository.findByAggregateId(item.id, {
          pagination,
          period,
          ascending,
        })
      ).toPlain(),
    );
  }

  async downloadActivitiesWithArchiver(
    res: Response,
    organizationId: string,
    id: string,
    subject: SubjectAttributes,
    startDate: string | undefined,
    endDate: string | undefined,
    limit: number,
    archive: Archiver,
  ) {
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="activities.zip"',
    });

    archive.pipe(res);

    let currentCursor = undefined;
    while (true) {
      const activities = await this.getActivities(
        organizationId,
        id,
        subject,
        startDate,
        endDate,
        limit,
        currentCursor,
        true,
      );
      if (activities.result.length === 0) {
        break;
      }
      const payload = activities.result.map((activity) => activity);

      archive.append(JSON.stringify(payload, null, 2), {
        name:
          activities.result[0].header.createdAt.toISOString() +
          "-" +
          activities.result[activities.result.length - 1].header.createdAt.toISOString() +
          ".json",
      });

      currentCursor = activities.paging_metadata.cursor ?? undefined;
    }

    await archive.finalize();
  }

  async downloadActivities(
    res: Response,
    organizationId: string,
    id: string,
    subject: SubjectAttributes,
    startDate: string | undefined,
    endDate: string | undefined,
  ) {
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });
    await this.downloadActivitiesWithArchiver(
      res,
      organizationId,
      id,
      subject,
      startDate,
      endDate,
      100,
      archive,
    );
  }

  private archiveGuard(item: IDigitalProductDocumentStatusChangeable): void {
    if (item.isArchived()) {
      throw new BadRequestException("Archived passport/ template cannot be modified");
    }
  }

  public saveEnvironmentCallback(item: T) {
    return async (options: DbSessionOptions) => {
      await this.digitalProductDocRepository.save(item, options);
    };
  }
}
