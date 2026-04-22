import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { DigitalProductDocumentStatus } from "../../digital-product-document/domain/digital-product-document-status";
import {
  findAllByOrganizationId,
  findOne,
  findOneOrFail,
  FindOptions,
  save,
} from "../../lib/repositories";
import { Template } from "../domain/template";
import { TemplateDoc, TemplateDocVersion } from "./template.schema";
import { IDigitalProductDocumentRepository } from "../../digital-product-document/infrastructure/digital-product-document-repository.interface";

@Injectable()
export class TemplateRepository implements IDigitalProductDocumentRepository<Template> {
  private templateDoc: MongooseModel<TemplateDoc>;

  constructor(
    @InjectModel(TemplateDoc.name)
    templateDoc: MongooseModel<TemplateDoc>,
  ) {
    this.templateDoc = templateDoc;
  }

  async fromPlain(plain: any) {
    return Template.fromPlain(plain);
  }

  migrate1_0_0To1_1_0(plain: any) {
    return {
      ...plain,
      lastStatusChange: {
        currentStatus: DigitalProductDocumentStatus.Draft,
      },
      _schemaVersion: TemplateDocVersion.v1_1_0,
    };
  }

  async fromPlainWithMigration(plain: any): Promise<Template> {
    let migratedVersion = plain;
    if (migratedVersion._schemaVersion === TemplateDocVersion.v1_0_0) {
      migratedVersion = this.migrate1_0_0To1_1_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async save(template: Template, options?: DbSessionOptions) {
    return await save(
      template,
      this.templateDoc,
      TemplateDocVersion.v1_1_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.templateDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.templateDoc, this.fromPlainWithMigration.bind(this));
  }

  async findAllByOrganizationId(organizationId: string, options?: FindOptions) {
    return await findAllByOrganizationId(
      this.templateDoc,
      this.fromPlainWithMigration.bind(this),
      organizationId,
      options,
    );
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.templateDoc.findByIdAndDelete(id, options);
  }
}
