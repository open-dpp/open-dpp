import { randomUUID } from "node:crypto";
import {
  KeyTypesType,
  Permissions,
  PresentationComponentNameType,
  PresentationConfigurationDtoSchema,
  PresentationConfigurationInvariantsSchema,
  PresentationConfigurationPatchDto,
  PresentationReferenceType,
  PresentationReferenceTypeType,
} from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { AasAbility } from "../../aas/domain/security/aas-ability";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export type PresentationComponentName = PresentationComponentNameType;

/**
 * Immutable domain entity for a presentation configuration.
 *
 * **Copy-on-write pattern (not a GoF builder)**
 * All fields are `readonly` and the constructor is private.  State changes are
 * expressed through the `withX()` / `withoutX()` / `withPatch()` family of
 * methods, each of which delegates to the private `copyWith()` helper.
 * `copyWith()` constructs a brand-new `PresentationConfiguration` instance,
 * forwarding unchanged fields from `this` and stamping `updatedAt` with the
 * current instant.  Callers that chain multiple updates therefore accumulate
 * immutable snapshots:
 *
 * ```ts
 * let next = config;
 * next = next.withElementDesign(path, component);
 * next = next.withDefaultComponent(type, component);
 * await repository.update(next); // persist the final snapshot only
 * ```
 *
 * This satisfies the immutability requirement in CLAUDE.md and is the reason
 * reviewer comment #3323059001 ("convert to a mutable builder") was declined —
 * a mutable builder would break the `readonly` contracts, bypass invariant
 * validation in `create()`, and render `updatedAt` incorrect.
 */
export class PresentationConfiguration implements IPersistable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly referenceId: string,
    public readonly referenceType: PresentationReferenceTypeType,
    public readonly label: string | null,
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
    label?: string | null;
    elementDesign?:
      | ReadonlyMap<string, PresentationComponentName>
      | Record<string, PresentationComponentName>;
    defaultComponents?:
      | ReadonlyMap<KeyTypesType, PresentationComponentName>
      | Partial<Record<KeyTypesType, PresentationComponentName>>;
    createdAt?: Date;
    updatedAt?: Date;
  }): PresentationConfiguration {
    const label = data.label ?? null;
    try {
      PresentationConfigurationInvariantsSchema.parse({
        organizationId: data.organizationId,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        label,
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
      label,
      toStringMap(data.elementDesign),
      toKeyTypesMap(data.defaultComponents),
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
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
      parsed.label,
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
      label: this.label,
      elementDesign: Object.fromEntries(this.elementDesign),
      defaultComponents: Object.fromEntries(this.defaultComponents) as Partial<
        Record<KeyTypesType, string>
      >,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  withElementDesign(path: string, component: PresentationComponentName): PresentationConfiguration {
    if (this.elementDesign.get(path) === component) {
      return this;
    }
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
    if (this.defaultComponents.get(type) === component) {
      return this;
    }
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

  withLabel(label: string | null): PresentationConfiguration {
    if (this.label === label) return this;
    return this.copyWith({ label });
  }

  withPatch(
    patch: PresentationConfigurationPatchDto,
    ability?: AasAbility,
  ): PresentationConfiguration {
    if (ability && patch.elementDesign) {
      const denied: string[] = [];
      for (const path of Object.keys(patch.elementDesign)) {
        if (!ability.can(Permissions.Edit, IdShortPath.create({ path }))) {
          denied.push(path);
        }
      }
      if (denied.length > 0) {
        throw new ForbiddenError(
          `Missing edit permission for presentation paths: ${denied.join(", ")}`,
        );
      }
    }

    let next: PresentationConfiguration | undefined;
    if (patch.elementDesign) {
      for (const [path, value] of Object.entries(patch.elementDesign)) {
        const base = next ?? this;
        next =
          value === null ? base.withoutElementDesign(path) : base.withElementDesign(path, value);
      }
    }
    if (patch.defaultComponents) {
      for (const [type, value] of Object.entries(patch.defaultComponents) as [
        KeyTypesType,
        PresentationComponentNameType | null,
      ][]) {
        const base = next ?? this;
        next =
          value === null
            ? base.withoutDefaultComponent(type)
            : base.withDefaultComponent(type, value);
      }
    }
    return next ?? this;
  }

  private copyWith(changes: {
    label?: string | null;
    elementDesign?: ReadonlyMap<string, PresentationComponentName>;
    defaultComponents?: ReadonlyMap<KeyTypesType, PresentationComponentName>;
  }): PresentationConfiguration {
    return new PresentationConfiguration(
      this.id,
      this.organizationId,
      this.referenceId,
      this.referenceType,
      changes.label !== undefined ? changes.label : this.label,
      changes.elementDesign ?? this.elementDesign,
      changes.defaultComponents ?? this.defaultComponents,
      this.createdAt,
      DateTime.now(),
    );
  }
}

function toStringMap(
  input:
    | ReadonlyMap<string, PresentationComponentName>
    | Record<string, PresentationComponentName>
    | undefined,
): ReadonlyMap<string, PresentationComponentName> {
  if (!input) return new Map();
  if (input instanceof Map) return new Map(input);
  return new Map(Object.entries(input));
}

function toKeyTypesMap(
  input:
    | ReadonlyMap<KeyTypesType, PresentationComponentName>
    | Partial<Record<KeyTypesType, PresentationComponentName>>
    | undefined,
): ReadonlyMap<KeyTypesType, PresentationComponentName> {
  if (!input) return new Map();
  if (input instanceof Map) return new Map(input);
  return new Map(Object.entries(input) as [KeyTypesType, PresentationComponentName][]);
}
