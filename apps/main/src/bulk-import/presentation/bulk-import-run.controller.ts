import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type {
  BulkImportRunCreateDto,
  BulkImportRunDto,
  BulkImportRunItemPaginationDto,
  BulkImportRunPaginationDto,
} from "@open-dpp/dto";
import {
  BulkImportRunCreateDtoSchema,
  BulkImportRunDtoSchema,
  BulkImportRunItemPaginationDtoSchema,
  BulkImportRunPaginationDtoSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserIdDecorator } from "../../identity/auth/presentation/decorators/user-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import { CursorQueryParam } from "../../aas/presentation/aas.decorators";
import { LimitQueryParam } from "../../digital-product-document/presentation/digital-product-document-decorators";
import { Pagination } from "../../pagination/pagination";
import { BulkImportConfigService } from "../application/services/bulk-import-config.service";
import { BulkImportRunService } from "../application/services/bulk-import-run.service";

@Controller()
export class BulkImportRunController {
  constructor(
    private readonly bulkImportConfigService: BulkImportConfigService,
    private readonly bulkImportRunService: BulkImportRunService,
  ) {}

  @Post("bulk-import-configs/:configId/runs")
  async createRun(
    @OrganizationId() organizationId: string,
    @Param("configId") configId: string,
    @Body(new ZodValidationPipe(BulkImportRunCreateDtoSchema)) body: BulkImportRunCreateDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
  ): Promise<BulkImportRunDto> {
    const config = await this.bulkImportConfigService.findById(configId, organizationId);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const run = await this.bulkImportRunService.createRun(config, body.rows, subject, userId);
    return BulkImportRunDtoSchema.parse(run.toPlain());
  }

  @Get("bulk-import-configs/:configId/runs")
  async getRunsForConfig(
    @OrganizationId() organizationId: string,
    @Param("configId") configId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<BulkImportRunPaginationDto> {
    await this.bulkImportConfigService.findById(configId, organizationId);
    const pagination = Pagination.create({ limit, cursor });
    const page = await this.bulkImportRunService.findAllByBulkImportConfigId(configId, pagination);
    return BulkImportRunPaginationDtoSchema.parse(page.toPlain());
  }

  @Get("bulk-import-runs/:id")
  async getRun(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
  ): Promise<BulkImportRunDto> {
    const run = await this.bulkImportRunService.findByIdAndCheckOwnership(id, organizationId);
    return BulkImportRunDtoSchema.parse(run.toPlain());
  }

  @Get("bulk-import-runs/:id/items")
  async getRunItems(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
  ): Promise<BulkImportRunItemPaginationDto> {
    const items = await this.bulkImportRunService.findItemsForRun(id, organizationId);
    return BulkImportRunItemPaginationDtoSchema.parse({
      paging_metadata: { cursor: null },
      result: items.map((item) => item.toPlain()),
    });
  }
}
