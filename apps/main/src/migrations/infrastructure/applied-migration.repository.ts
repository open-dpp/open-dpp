import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppliedMigration } from "../domain/applied-migration";
import { AppliedMigrationDoc, AppliedMigrationDocument } from "./applied-migration.schema";

@Injectable()
export class AppliedMigrationRepository {
  constructor(
    @InjectModel(AppliedMigrationDoc.name)
    private readonly model: Model<AppliedMigrationDocument>,
  ) {}

  async insert(appliedMigration: AppliedMigration): Promise<void> {
    const { id, appliedAt } = appliedMigration.toPlain();
    await this.model.create({ _id: id, appliedAt });
  }

  async findAllIds(): Promise<string[]> {
    const documents = await this.model.find({}, { _id: 1 }).lean();
    return documents.map((document) => document._id);
  }
}
