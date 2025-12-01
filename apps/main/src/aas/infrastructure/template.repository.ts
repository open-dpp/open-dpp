import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Template } from "../domain/template";
import { findOne, findOneOrFail, save } from "./repository-helpers";
import { TemplateDoc, TemplateDocVersion } from "./schemas/template.schema";

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
}
