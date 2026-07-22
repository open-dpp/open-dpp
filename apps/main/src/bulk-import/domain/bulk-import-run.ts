import { randomUUID } from "node:crypto";
import { BulkImportRunStatusDto, BulkImportRunStatusDtoEnum, BulkImportRunStatusDtoType } from "@open-dpp/dto";
import { z } from "zod";
import { IPersistable } from "../../aas/domain/persistable";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { MemberRoleEnum, MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import { UserRoleEnum, UserRoleType } from "../../identity/users/domain/user-role.enum";
import { DateTime } from "../../lib/date-time";

const DateTimeSchema = z.union([z.iso.datetime(), z.date()]);

export const BulkImportRunSchema = z.object({
  id: z.string(),
  bulkImportConfigId: z.string(),
  organizationId: z.string(),
  status: BulkImportRunStatusDtoEnum,
  userRole: UserRoleEnum,
  memberRole: MemberRoleEnum.optional(),
  userId: z.string(),
  totalCount: z.number(),
  succeededCount: z.number(),
  failedCount: z.number(),
  startedAt: DateTimeSchema.nullish(),
  finishedAt: DateTimeSchema.nullish(),
  createdAt: DateTimeSchema,
});

export class BulkImportRun implements IPersistable {
  private constructor(
    public readonly id: string,
    public readonly bulkImportConfigId: string,
    public readonly organizationId: string,
    private _status: BulkImportRunStatusDtoType,
    private readonly userRole: UserRoleType,
    private readonly memberRole: MemberRoleType | undefined,
    public readonly userId: string,
    public readonly totalCount: number,
    private _succeededCount: number,
    private _failedCount: number,
    private _startedAt: Date | null,
    private _finishedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(data: {
    id?: string;
    bulkImportConfigId: string;
    organizationId: string;
    subject: SubjectAttributes;
    userId: string;
    totalCount: number;
    createdAt?: Date;
  }): BulkImportRun {
    const { userRole, memberRole } = data.subject.getRoles();
    return new BulkImportRun(
      data.id ?? randomUUID(),
      data.bulkImportConfigId,
      data.organizationId,
      BulkImportRunStatusDto.Pending,
      userRole,
      memberRole,
      data.userId,
      data.totalCount,
      0,
      0,
      null,
      null,
      data.createdAt ?? DateTime.now(),
    );
  }

  static fromPlain(data: unknown): BulkImportRun {
    const parsed = BulkImportRunSchema.parse(data);
    return new BulkImportRun(
      parsed.id,
      parsed.bulkImportConfigId,
      parsed.organizationId,
      parsed.status,
      parsed.userRole,
      parsed.memberRole,
      parsed.userId,
      parsed.totalCount,
      parsed.succeededCount,
      parsed.failedCount,
      parsed.startedAt ? new Date(parsed.startedAt) : null,
      parsed.finishedAt ? new Date(parsed.finishedAt) : null,
      new Date(parsed.createdAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      bulkImportConfigId: this.bulkImportConfigId,
      organizationId: this.organizationId,
      status: this._status,
      userRole: this.userRole,
      memberRole: this.memberRole,
      userId: this.userId,
      totalCount: this.totalCount,
      succeededCount: this._succeededCount,
      failedCount: this._failedCount,
      startedAt: this._startedAt?.toISOString() ?? null,
      finishedAt: this._finishedAt?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
    };
  }

  get status(): BulkImportRunStatusDtoType {
    return this._status;
  }

  get subject(): SubjectAttributes {
    return SubjectAttributes.create({ userRole: this.userRole, memberRole: this.memberRole });
  }

  get succeededCount(): number {
    return this._succeededCount;
  }

  get failedCount(): number {
    return this._failedCount;
  }

  get processedCount(): number {
    return this._succeededCount + this._failedCount;
  }

  start(): void {
    if (this._status !== BulkImportRunStatusDto.Pending) {
      return;
    }
    this._status = BulkImportRunStatusDto.Running;
    this._startedAt = DateTime.now();
  }

  recordItemOutcome(succeeded: boolean): void {
    if (succeeded) {
      this._succeededCount += 1;
    } else {
      this._failedCount += 1;
    }
  }

  complete(): void {
    this._status =
      this._failedCount > 0 ? BulkImportRunStatusDto.CompletedWithErrors : BulkImportRunStatusDto.Completed;
    this._finishedAt = DateTime.now();
  }

  markInterrupted(): void {
    if (this._status !== BulkImportRunStatusDto.Pending && this._status !== BulkImportRunStatusDto.Running) {
      return;
    }
    this._status = BulkImportRunStatusDto.Interrupted;
    this._finishedAt = DateTime.now();
  }

  isRunning(): boolean {
    return this._status === BulkImportRunStatusDto.Pending || this._status === BulkImportRunStatusDto.Running;
  }
}
