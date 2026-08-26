import type {
  CreateGs1UniqueProductIdentifierRequest,
  CreateInternalUniqueProductIdentifierRequest,
  UpdateGs1UniqueProductIdentifierRequest,
} from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CreateGs1UniqueProductIdentifierRequestSchema,
  CreateInternalUniqueProductIdentifierRequestSchema,
  UniqueProductIdentifierPaginationDtoSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { CursorQueryParam } from "../../aas/presentation/aas.decorators";
import { LimitQueryParam } from "../../digital-product-document/presentation/digital-product-document-decorators";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { PassportService } from "../../passports/application/services/passport.service";
import { UpiCollectionService } from "../application/services/upi-collection.service";

@Controller("unique-product-identifiers")
export class UniqueProductIdentifierController {
  constructor(
    private readonly upiCollectionService: UpiCollectionService,
    private readonly passportService: PassportService,
  ) {}

  @Get()
  async list(
    @OrganizationId() orgId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const pagination = Pagination.create({ limit, cursor });
    const { items, cursor: nextCursor } = await this.upiCollectionService.list(orgId, pagination);
    return UniqueProductIdentifierPaginationDtoSchema.parse({
      paging_metadata: { cursor: nextCursor },
      result: items,
    });
  }

  @Get(":id")
  async getById(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    const upi = await this.upiCollectionService.get(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      upi.referenceId,
      subject,
      orgId,
    );
    return upi;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @OrganizationId() orgId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(CreateGs1UniqueProductIdentifierRequestSchema))
    body: CreateGs1UniqueProductIdentifierRequest,
  ) {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      body.referenceId,
      subject,
      orgId,
    );

    return this.upiCollectionService.create({
      referenceId: body.referenceId,
      gtin: body.gtin,
      batch: body.batch,
      serial: body.serial,
      organizationId: orgId,
    });
  }

  @Post("internal")
  @HttpCode(HttpStatus.CREATED)
  async createInternal(
    @OrganizationId() orgId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(CreateInternalUniqueProductIdentifierRequestSchema))
    body: CreateInternalUniqueProductIdentifierRequest,
  ) {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      body.referenceId,
      subject,
      orgId,
    );

    return this.upiCollectionService.createInternal({
      referenceId: body.referenceId,
      organizationId: orgId,
    });
  }

  @Patch(":id")
  async update(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(UpdateGs1UniqueProductIdentifierRequestSchema))
    body: UpdateGs1UniqueProductIdentifierRequest,
  ) {
    const upiSnapshot = await this.upiCollectionService.get(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      upiSnapshot.referenceId,
      subject,
      orgId,
    );
    return this.upiCollectionService.update(id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    const upiSnapshot = await this.upiCollectionService.get(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      upiSnapshot.referenceId,
      subject,
      orgId,
    );
    await this.upiCollectionService.delete(id);
  }
}
