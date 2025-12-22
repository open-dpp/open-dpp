import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Pagination } from "../../aas/domain/pagination";
import { findAllByOrganizationId, findOne, findOneOrFail, save } from "../../lib/repositories";
import { Template } from "../domain/template";
import { TemplateDoc, TemplateDocVersion } from "./template.schema";

@Injectable()
export class TemplateRepository {
  private templateDoc: MongooseModel<TemplateDoc>;

  constructor(
    @InjectModel(TemplateDoc.name)
    templateDoc: MongooseModel<TemplateDoc>,
  ) {
    this.templateDoc = templateDoc;
  }

  async save(template: Template) {
    return await save(template, this.templateDoc, TemplateDocVersion.v1_0_0, Template.fromPlain);
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.templateDoc, Template.fromPlain);
  }

  async findOne(id: string) {
    return await findOne(id, this.templateDoc, Template.fromPlain);
  }

  async findAllByOrganizationId(organizationId: string, pagination?: Pagination) {
    return await findAllByOrganizationId(this.templateDoc, Template.fromPlain, organizationId, pagination);
  }
}
