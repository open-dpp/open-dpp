import { randomUUID } from "node:crypto";
import { z } from "zod";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { FieldMappingSchema } from "./field-mapping";
import { JsonTransformer } from "./json-transformer";
import { ValueResponseDto, ValueSchema } from "@open-dpp/dto";

const DateTimeSchema = z.union([z.iso.datetime(), z.date()]);

const SubmodelMappingSchema = z.object({
  submodelIdShort: z.string(),
  fieldMappings: FieldMappingSchema.array(),
});

export const BulkImportConfigSchema = z.object({
  id: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid(),
  name: z.string(),
  idField: z.string(),
  submodelMappings: SubmodelMappingSchema.array(),
  inputSample: z.record(z.string(), z.unknown()).nullish(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export class BulkImportConfig implements IPersistable {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly templateId: string,
    private _name: string,
    private _idField: string,
    /** Keyed by submodel idShort, not id - a submodel's id is regenerated whenever its
     * environment is copied (e.g. creating a passport from this config's template), so id can't
     * be resolved at mapping-time and must be looked up by idShort against the target passport. */
    private _submodelMappings: Map<string, JsonTransformer>,
    private _inputSample: Record<string, unknown> | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    templateId: string;
    name: string;
    idField: string;
    submodelMappings?: Map<string, JsonTransformer>;
    inputSample?: Record<string, unknown> | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): BulkImportConfig {
    const now = DateTime.now();
    return new BulkImportConfig(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId,
      data.name,
      data.idField,
      data.submodelMappings ?? new Map(),
      data.inputSample ?? null,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static fromPlain(data: unknown): BulkImportConfig {
    const parsed = BulkImportConfigSchema.parse(data);
    return new BulkImportConfig(
      parsed.id,
      parsed.organizationId,
      parsed.templateId,
      parsed.name,
      parsed.idField,
      new Map(
        parsed.submodelMappings.map((mapping) => [
          mapping.submodelIdShort,
          JsonTransformer.fromPlain({ fieldMappings: mapping.fieldMappings }),
        ]),
      ),
      parsed.inputSample ?? null,
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      templateId: this.templateId,
      name: this._name,
      idField: this._idField,
      submodelMappings: Array.from(this._submodelMappings.entries()).map(
        ([submodelIdShort, transformer]) => ({
          submodelIdShort,
          fieldMappings: transformer.toPlain().fieldMappings,
        }),
      ),
      inputSample: this._inputSample,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  get name(): string {
    return this._name;
  }

  get idField(): string {
    return this._idField;
  }

  get inputSample(): Record<string, unknown> | null {
    return this._inputSample;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  getSubmodelMappings(): Map<string, JsonTransformer> {
    return this._submodelMappings;
  }

  updateMapping(data: {
    name?: string;
    idField?: string;
    submodelMappings?: Map<string, JsonTransformer>;
    inputSample?: Record<string, unknown> | null;
  }): void {
    if (data.name !== undefined) {
      this._name = data.name;
    }
    if (data.idField !== undefined) {
      this._idField = data.idField;
    }
    if (data.submodelMappings !== undefined) {
      this._submodelMappings = data.submodelMappings;
    }
    if (data.inputSample !== undefined) {
      this._inputSample = data.inputSample;
    }
    this._updatedAt = DateTime.now();
  }

  /** Transforms a row into a value representation per targeted submodel, keyed by submodel idShort. */
  async applyToRow(row: Record<string, unknown>): Promise<Record<string, ValueResponseDto>> {
    const result: Record<string, ValueResponseDto> = {};
    for (const [submodelIdShort, transformer] of this._submodelMappings) {
      result[submodelIdShort] = ValueSchema.parse(await transformer.apply(row));
    }
    return result;
  }

  /** idField is a jsonata path, same convention as a FieldMapping input path. */
  async extractIdValue(row: Record<string, unknown>): Promise<string | undefined> {
    const raw = await JsonTransformer.evaluatePath(this._idField, row);
    if (raw === undefined || raw === null) {
      return undefined;
    }
    const value = String(raw).trim();
    return value.length > 0 ? value : undefined;
  }
}
