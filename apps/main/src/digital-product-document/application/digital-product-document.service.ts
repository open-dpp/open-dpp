import { ForbiddenException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { EnvironmentService, UserContext } from "../../aas/presentation/environment.service";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Response } from "express";

import type {
  ApiVersionsDtoType,
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellResponseDto,
  DeletePolicyDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  ValueRequestDto,
} from "@open-dpp/dto";

import { ActivityPaginationDtoSchema } from "@open-dpp/dto";

import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { DbSessionOptions } from "../../database/query-options";
import {
  DigitalProductDocumentEntity,
  IDigitalProductDocumentRepository,
} from "../infrastructure/digital-product-document-repository.interface";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { Pagination } from "../../pagination/pagination";
import archiver, { Archiver } from "archiver";
import { IDigitalProductDocumentStatusChangeable } from "../domain/digital-product-document-status";
import { Period } from "../../time/period";
import type { Connection } from "mongoose";
import { ActivityTypesType } from "../../activity-history/domain/activities/activity-types";
import { SubmodelElementRequest } from "../../aas/presentation/requests/submodel-element.request";
import { SubmodelRequest } from "../../aas/presentation/requests/submodel.request";
import { SubmodelModificationRequest } from "../../aas/presentation/requests/submodel-modification.request";
import { ValueModificationRequest } from "../../aas/presentation/requests/value-modification.request";
import { SubmodelElementModificationRequest } from "../../aas/presentation/requests/submodel-element-modification.request";

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
    version: ApiVersionsDtoType,
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
      SubmodelRequest.create({ body, version }),
      this.saveEnvironmentCallback(item),
      userContext,
    );
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
    version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addColumn(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      SubmodelElementRequest.create({ body, version }),
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
    version: ApiVersionsDtoType,
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
      version,
    );
  }

  async createSubmodelElement(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    body: SubmodelElementRequestDto,
    userContext: UserContext,
    version: ApiVersionsDtoType,
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
      SubmodelElementRequest.create({ body, version }),
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
    version: ApiVersionsDtoType,
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
      SubmodelElementRequest.create({ body, version }),
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
    version: ApiVersionsDtoType,
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
      SubmodelModificationRequest.create({ body, version }),
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
    version: ApiVersionsDtoType,
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
      ValueModificationRequest.create({ body, version }),
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
    version: ApiVersionsDtoType,
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
      SubmodelElementModificationRequest.create({ body, version }),
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
    version: ApiVersionsDtoType,
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
      SubmodelElementModificationRequest.create({ body, version }),
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
    extraCleanup?: (submodelIdShort: string, options: DbSessionOptions) => Promise<void>,
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
      extraCleanup,
    );
  }

  async deleteSubmodelElement(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    userContext: UserContext,
    extraCleanup?: (idShortPathString: string, options: DbSessionOptions) => Promise<void>,
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
      extraCleanup,
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
    version: ApiVersionsDtoType,
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
      version,
    );
  }

  async addColumnToGroupInSubmodelElementList(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    groupIdShort: string,
    body: SubmodelElementRequestDto,
    position: number | undefined,
    userContext: UserContext,
    version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.addColumnToGroup(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      groupIdShort,
      SubmodelElementRequest.create({ body, version }),
      userContext,
      position,
    );
  }

  async modifyColumnInGroupOfSubmodelElementList(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    groupIdShort: string,
    idShortOfColumn: string,
    body: SubmodelModificationDto,
    userContext: UserContext,
    version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.modifyColumnInGroup(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      groupIdShort,
      idShortOfColumn,
      SubmodelElementModificationRequest.create({ body, version }),
      userContext,
    );
  }

  async deleteColumnFromGroupInSubmodelElementList(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    groupIdShort: string,
    idShortOfColumn: string,
    userContext: UserContext,
    version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.deleteColumnFromGroup(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      groupIdShort,
      idShortOfColumn,
      userContext,
      version,
    );
  }

  async moveColumnToGroupInSubmodelElementList(
    correlationId: string,
    organizationId: string,
    id: string,
    submodelId: string,
    idShortPath: IdShortPath,
    groupIdShort: string,
    columnIdShort: string,
    userContext: UserContext,
    version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const item = await this.loadDigitalProductDocumentAndCheckOwnership(
      id,
      userContext.subject,
      organizationId,
    );
    this.archiveGuard(item);
    return await this.environmentService.moveColumnToGroup(
      correlationId,
      id,
      item.getEnvironment(),
      submodelId,
      idShortPath,
      groupIdShort,
      columnIdShort,
      userContext,
      version,
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
    version: ApiVersionsDtoType,
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
      version,
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
    version: ApiVersionsDtoType,
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
      ValueModificationRequest.create({ body, version }),
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
