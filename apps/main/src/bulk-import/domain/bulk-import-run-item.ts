import { randomUUID } from "node:crypto";
import {
  BulkImportRunItemStatusDto,
  BulkImportRunItemStatusDtoEnum,
  type BulkImportRunItemStatusDtoType,
} from "@open-dpp/dto";
import { z } from "zod";
import { IPersistable } from "../../aas/domain/persistable";

export const BulkImportRunItemSchema = z.object({
  id: z.string(),
  runId: z.string(),
  rowIndex: z.number(),
  // Mongoose drops an empty-object Mixed field to `undefined` on read, so default it back.
  inputData: z.record(z.string(), z.unknown()).default({}),
  status: BulkImportRunItemStatusDtoEnum,
  passportId: z.string().nullish(),
  error: z.string().nullish(),
});

export class BulkImportRunItem implements IPersistable {
  private constructor(
    public readonly id: string,
    public readonly runId: string,
    public readonly rowIndex: number,
    public readonly inputData: Record<string, unknown>,
    private _status: BulkImportRunItemStatusDtoType,
    private _passportId: string | null,
    private _error: string | null,
  ) {}

  static create(data: {
    id?: string;
    runId: string;
    rowIndex: number;
    inputData: Record<string, unknown>;
  }): BulkImportRunItem {
    return new BulkImportRunItem(
      data.id ?? randomUUID(),
      data.runId,
      data.rowIndex,
      data.inputData,
      BulkImportRunItemStatusDto.Pending,
      null,
      null,
    );
  }

  static fromPlain(data: unknown): BulkImportRunItem {
    const parsed = BulkImportRunItemSchema.parse(data);
    return new BulkImportRunItem(
      parsed.id,
      parsed.runId,
      parsed.rowIndex,
      parsed.inputData,
      parsed.status,
      parsed.passportId ?? null,
      parsed.error ?? null,
    );
  }

  toPlain() {
    return {
      id: this.id,
      runId: this.runId,
      rowIndex: this.rowIndex,
      inputData: this.inputData,
      status: this._status,
      passportId: this._passportId,
      error: this._error,
    };
  }

  get status(): BulkImportRunItemStatusDtoType {
    return this._status;
  }

  get passportId(): string | null {
    return this._passportId;
  }

  get error(): string | null {
    return this._error;
  }

  failed(): boolean {
    return this._status === BulkImportRunItemStatusDto.Failed;
  }

  pending(): boolean {
    return this._status === BulkImportRunItemStatusDto.Pending;
  }

  markCreated(passportId: string): void {
    this._status = BulkImportRunItemStatusDto.Created;
    this._passportId = passportId;
    this._error = null;
  }

  markUpdated(passportId: string): void {
    this._status = BulkImportRunItemStatusDto.Updated;
    this._passportId = passportId;
    this._error = null;
  }

  markFailed(error: string): void {
    this._status = BulkImportRunItemStatusDto.Failed;
    this._error = error;
  }
}
