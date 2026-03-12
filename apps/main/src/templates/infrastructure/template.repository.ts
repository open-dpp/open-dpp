import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../../aas/infrastructure/digital-product-passport-identifiable.repository";
import { InitializeSecurityMigrationService } from "../../aas/infrastructure/initialize-security-migration.service";
import { DbSessionOptions } from "../../database/query-options";
import { findAllByOrganizationId, findOne, findOneOrFail, save } from "../../lib/repositories";
import { Pagination } from "../../pagination/pagination";
import { Template } from "../domain/template";
import { TemplateDoc, TemplateDocVersion } from "./template.schema";

@Injectable()
export class TemplateRepository implements IDigitalProductPassportIdentifiableRepository {
  private templateDoc: MongooseModel<TemplateDoc>;

  constructor(
    @InjectModel(TemplateDoc.name)
    templateDoc: MongooseModel<TemplateDoc>,
    private readonly initializeSecurityMigrationService: InitializeSecurityMigrationService,
  ) {
    this.templateDoc = templateDoc;
  }

  async fromPlain(plain: any) {
    return Template.fromPlain(plain);
  }

  async fromPlainWithMigration(plain: any): Promise<Template> {
    let migratedVersion = plain;
    if (plain._schemaVersion === TemplateDocVersion.v1_0_0) {
      migratedVersion = await this.migration1_0_0To1_1_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async migration1_0_0To1_1_0(template: { environment: { assetAdministrationShells: string[]; submodels: string[] }; organizationId: string }) {
    await this.initializeSecurityMigrationService.migrate(template);
    return {
      ...template,
      _schemaVersion: TemplateDocVersion.v1_1_0,
    };
  }

  async save(template: Template, options?: DbSessionOptions) {
    return await save(template, this.templateDoc, TemplateDocVersion.v1_1_0, this.fromPlain.bind(this), undefined, options);
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.templateDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.templateDoc, this.fromPlainWithMigration.bind(this));
  }

  async findAllByOrganizationId(organizationId: string, pagination?: Pagination) {
    return await findAllByOrganizationId(this.templateDoc, Template.fromPlain, organizationId, pagination);
  }
}
