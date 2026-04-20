import { randomUUID } from "node:crypto";
import {
  KeyTypesType,
  PresentationConfigurationDtoSchema,
  PresentationConfigurationInvariantsSchema,
  PresentationReferenceType,
  PresentationReferenceTypeType,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export type PresentationComponentName = string;

export class PresentationConfiguration implements IPersistable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly referenceId: string,
    public readonly referenceType: PresentationReferenceTypeType,
    public readonly elementDesign: ReadonlyMap<string, PresentationComponentName>,
    public readonly defaultComponents: ReadonlyMap<KeyTypesType, PresentationComponentName>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    referenceId: string;
    referenceType: PresentationReferenceTypeType;
    elementDesign?: ReadonlyMap<string, PresentationComponentName> | Record<string, string>;
    defaultComponents?:
      | ReadonlyMap<KeyTypesType, PresentationComponentName>
      | Partial<Record<KeyTypesType, string>>;
    createdAt?: Date;
    updatedAt?: Date;
  }): PresentationConfiguration {
    try {
      PresentationConfigurationInvariantsSchema.parse({
        organizationId: data.organizationId,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new ValueError(`Invalid PresentationConfiguration: ${details.join("; ")}`, {
          cause: error,
        });
      }
      throw error;
    }
    const now = DateTime.now();
    return new PresentationConfiguration(
      data.id ?? randomUUID(),
      data.organizationId,
      data.referenceId,
      data.referenceType,
      toStringMap(data.elementDesign),
      toKeyTypesMap(data.defaultComponents),
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static createForTemplate(data: {
    organizationId: string;
    referenceId: string;
  }): PresentationConfiguration {
    return PresentationConfiguration.create({
      organizationId: data.organizationId,
      referenceId: data.referenceId,
      referenceType: PresentationReferenceType.Template,
    });
  }

  static createForPassport(data: {
    organizationId: string;
    referenceId: string;
  }): PresentationConfiguration {
    return PresentationConfiguration.create({
      organizationId: data.organizationId,
      referenceId: data.referenceId,
      referenceType: PresentationReferenceType.Passport,
    });
  }

  static fromPlain(data: unknown): PresentationConfiguration {
    const parsed = PresentationConfigurationDtoSchema.parse(data);
    return new PresentationConfiguration(
      parsed.id,
      parsed.organizationId,
      parsed.referenceId,
      parsed.referenceType,
      toStringMap(parsed.elementDesign),
      toKeyTypesMap(parsed.defaultComponents),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      referenceId: this.referenceId,
      referenceType: this.referenceType,
      elementDesign: Object.fromEntries(this.elementDesign),
      defaultComponents: Object.fromEntries(this.defaultComponents) as Partial<
        Record<KeyTypesType, string>
      >,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  withElementDesign(path: string, component: PresentationComponentName): PresentationConfiguration {
    const next = new Map(this.elementDesign);
    next.set(path, component);
    return this.copyWith({ elementDesign: next });
  }

  withoutElementDesign(path: string): PresentationConfiguration {
    if (!this.elementDesign.has(path)) {
      return this;
    }
    const next = new Map(this.elementDesign);
    next.delete(path);
    return this.copyWith({ elementDesign: next });
  }

  withDefaultComponent(
    type: KeyTypesType,
    component: PresentationComponentName,
  ): PresentationConfiguration {
    const next = new Map(this.defaultComponents);
    next.set(type, component);
    return this.copyWith({ defaultComponents: next });
  }

  withoutDefaultComponent(type: KeyTypesType): PresentationConfiguration {
    if (!this.defaultComponents.has(type)) {
      return this;
    }
    const next = new Map(this.defaultComponents);
    next.delete(type);
    return this.copyWith({ defaultComponents: next });
  }

  private copyWith(changes: {
    elementDesign?: ReadonlyMap<string, PresentationComponentName>;
    defaultComponents?: ReadonlyMap<KeyTypesType, PresentationComponentName>;
  }): PresentationConfiguration {
    return new PresentationConfiguration(
      this.id,
      this.organizationId,
      this.referenceId,
      this.referenceType,
      changes.elementDesign ?? this.elementDesign,
      changes.defaultComponents ?? this.defaultComponents,
      this.createdAt,
      DateTime.now(),
    );
  }
}

function toStringMap(
  input: ReadonlyMap<string, string> | Record<string, string> | undefined,
): ReadonlyMap<string, string> {
  if (!input) return new Map();
  if (input instanceof Map) return new Map(input);
  return new Map(Object.entries(input));
}

function toKeyTypesMap(
  input: ReadonlyMap<KeyTypesType, string> | Partial<Record<KeyTypesType, string>> | undefined,
): ReadonlyMap<KeyTypesType, string> {
  if (!input) return new Map();
  if (input instanceof Map) return new Map(input);
  return new Map(Object.entries(input) as [KeyTypesType, string][]);
}
