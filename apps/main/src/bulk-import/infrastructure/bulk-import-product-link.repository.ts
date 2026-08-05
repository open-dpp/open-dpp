import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { convertToDomain, save } from "../../lib/repositories";
import { BulkImportProductLink } from "../domain/bulk-import-product-link";
import { BulkImportProductLinkDoc } from "./bulk-import-product-link.schema";

const SCHEMA_VERSION = "1.0.0";

@Injectable()
export class BulkImportProductLinkRepository {
  private bulkImportProductLinkDoc: MongooseModel<BulkImportProductLinkDoc>;

  constructor(
    @InjectModel(BulkImportProductLinkDoc.name)
    bulkImportProductLinkDoc: MongooseModel<BulkImportProductLinkDoc>,
  ) {
    this.bulkImportProductLinkDoc = bulkImportProductLinkDoc;
  }

  async fromPlain(plain: any) {
    return BulkImportProductLink.fromPlain(plain);
  }

  async save(link: BulkImportProductLink, options?: DbSessionOptions) {
    return await save(
      link,
      this.bulkImportProductLinkDoc,
      SCHEMA_VERSION,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOne(
    organizationId: string,
    templateId: string,
    externalId: string,
  ): Promise<BulkImportProductLink | undefined> {
    const doc = await this.bulkImportProductLinkDoc.findOne({
      organizationId,
      templateId,
      externalId,
    });
    if (!doc) {
      return undefined;
    }
    return await convertToDomain(doc, this.fromPlain.bind(this));
  }

  async deleteAllByTemplateId(templateId: string, options?: DbSessionOptions): Promise<void> {
    await this.bulkImportProductLinkDoc.deleteMany({ templateId }, { session: options?.session });
  }
}
