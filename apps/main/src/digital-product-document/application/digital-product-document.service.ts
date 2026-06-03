import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { EnvironmentService, UserContext } from "../../aas/presentation/environment.service";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Response } from "express";

import {
  ActivityPaginationDtoSchema,
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellResponseDto,
  DeletePolicyDto,
  DigitalProductDocumentStatusModificationDto,
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
import type { Connection } from "mongoose";
import { ActivityTypesType } from "../../activity-history/domain/activities/activity-types";
import { DigitalProductDocumentStatusChangedActivity } from "../../activity-history/domain/activities/digital-product-document-status-changed.activity";

export class DigitalProductDocumentService<T extends DigitalProductDocumentEntity> {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly digitalProductDocRepository: IDigitalProductDocumentRepository<T>,
    private readonly activityRepository: ActivityRepository,
    private connection: Connection,
  ) {}

  async createSubmodel(
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      body,
      this.saveEnvironmentCallback(item),
      userContext,
    );
  }

  async modifyStatus(
    correlationId: string,
    organizationId: string,
    id: string,
    body: DigitalProductDocumentStatusModificationDto,
    userContext: UserContext,
  ) {
    const item = (
      await this.loadDigitalProductDocumentAndCheckOwnership(
        id,
        userContext.subject,
        organizationId,
      )
    ).withTracking();
    if (body.method === "Publish") {
      item.publish();
    } else if (body.method === "Archive") {
      item.archive();
    } else if (body.method === "Restore") {
      item.restore();
    } else {
      throw new BadRequestException("Invalid method");
    }

    const activity = DigitalProductDocumentStatusChangedActivity.create({
      correlationId,
      userId: userContext.userId,
      digitalProductDocumentId: id,
      item,
    });

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.digitalProductDocRepository.save(item, { session });
        await this.activityRepository.createMany([activity], { session });
      });
    } finally {
      await session.endSession();
    }
    return item;
  }

  async addColumnToSubmodelElementList(
    correlationId: string,
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
      correlationId,
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
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      userContext,
      position,
    );
  }

  async createSubmodelElement(
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
    );
  }

  async createSubmodelElementAtIdShortPath(
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
      idShortPath,
    );
  }

  async modifyShell(
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      aasId,
      body,
      userContext,
    );
  }

  async modifySubmodel(
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
    );
  }

  async modifyValueOfSubmodel(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    body: ValueRequestDto,
    userContext: UserContext,
  ): Promise<SubmodelResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyValueOfSubmodel(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      body,
      userContext,
    );
  }

  async modifyColumnOfSubmodelElementList(
    correlationId: string,
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
      correlationId,
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
    correlationId: string,
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
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      body,
      idShortPath,
      userContext,
    );
  }

  async deleteSubmodel(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    userContext: UserContext,
  ): Promise<void> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    await this.environmentService.deleteSubmodelFromEnvironment(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      this.saveEnvironmentCallback(item),
      userContext,
    );
  }

  async deleteSubmodelElement(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userContext: UserContext,
  ): Promise<void> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    await this.environmentService.deleteSubmodelElement(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      userContext,
    );
  }

  async deleteColumnFromSubmodelElementList(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfColumn: string,
    userContext: UserContext,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.deleteColumn(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      idShortOfColumn,
      userContext,
    );
  }

  async deletePolicyBySubjectAndObject(
    correlationId: string,
    organizationId: string,
    id: string,
    body: DeletePolicyDto,
    userContext: UserContext,
  ): Promise<void> {
    const subject = SubjectAttributes.fromPlain(body.subject);
    const object = IdShortPath.create({ path: body.object });
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    await this.environmentService.deletePolicyBySubjectAndObject(
      correlationId,
      id,
      item.getEnvironment(),
      object,
      subject,
      userContext,
    );
  }

  async deleteRowFromSubmodelElementList(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    idShortOfRow: string,
    userContext: UserContext,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.deleteRow(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      idShortOfRow,
      userContext,
    );
  }

  async modifySubmodelElementValue(
    correlationId: string,
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
      correlationId,
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
    filterByActivityType: ActivityTypesType | ActivityTypesType[] | undefined,
    pathFilter: string | undefined,
    ascending: boolean = false,
  ) {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(item.getEnvironment(), subject);
    const period =
      startDate || endDate ? Period.fromIso({ start: startDate, end: endDate }) : undefined;

    const pagination = Pagination.create({ limit, cursor });
    const activities = await this.activityRepository.findByAggregateId(item.id, {
      pagination,
      period,
      ascending,
      filter: {
        activityType: filterByActivityType,
        path: pathFilter,
      },
    });
    return ActivityPaginationDtoSchema.parse(activities.toPlain({ ability }));
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
        undefined,
        undefined,
        true,
      );
      if (activities.result.length === 0) {
        break;
      }
      const payload = activities.result.map((activity) => activity);

      archive.append(JSON.stringify(payload, null, 2), {
        name:
          activities.result[0].header.createdAt +
          "-" +
          activities.result[activities.result.length - 1].header.createdAt +
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
      20,
      archive,
    );
  }

  async deleteDigitalProductDocument(
    organizationId: string,
    id: string,
    subject: SubjectAttributes,
    onDeleteCallback?: (options: DbSessionOptions) => Promise<void>,
  ) {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    if (!item.isDraft()) {
      throw new ForbiddenException(
        'Only passports/ templates with the status "Draft" can be deleted',
      );
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.environmentService.deleteEnvironment(item.getEnvironment(), session);
        await this.digitalProductDocRepository.deleteById(item.id, { session });
        await this.activityRepository.deleteByAggregateId(item.id, { session });
        if (onDeleteCallback) {
          await onDeleteCallback({ session });
        }
      });
    } finally {
      await session.endSession();
    }
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
