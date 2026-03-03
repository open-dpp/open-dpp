import { randomUUID } from "node:crypto";
import { TemplateDtoSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { ExpandedEnvironment, ExpandedEnvironmentPlain } from "../../aas/domain/expanded-environment";
import { IPersistable } from "../../aas/domain/persistable";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export type ExpandedTemplatePlain = Omit<ReturnType<Template["toPlain"]>, "environment"> & {
  environment: ExpandedEnvironmentPlain;
};

export class Template implements IPersistable, IDigitalProductPassportIdentifiable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
  }

  static create(data: {
    id?: string;
    organizationId: string;
    environment?: Environment;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const now = DateTime.now();
    return new Template(
      data.id ?? randomUUID(),
      data.organizationId,
      data.environment ?? Environment.create({}),
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = TemplateDtoSchema.parse(data);
    return new Template(
      parsed.id,
      parsed.organizationId,
      Environment.fromPlain(parsed.environment),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  async toExportPlain(expandedEnvironment: any) {
    return {
      ...this.toPlain(),
      environment: expandedEnvironment,
    };
  }

  static importFromPlain(
    data: ExpandedTemplatePlain,
    organizationId: string,
  ): { entity: Template; shells: AssetAdministrationShell[]; submodels: Submodel[] } {
    let expandedEnv: ExpandedEnvironment;
    try {
      expandedEnv = ExpandedEnvironment.fromPlain(data.environment);
    }
    catch (err) {
      if (err instanceof ValueError) {
        throw err;
      }
      throw err;
    }

    const { environment, shells, submodels } = expandedEnv.copyWithNewIds();

    const entity = Template.create({
      organizationId,
      environment,
      createdAt: data.createdAt instanceof Date ? data.createdAt : undefined,
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : undefined,
    });

    return { entity, shells, submodels };
  }
}
