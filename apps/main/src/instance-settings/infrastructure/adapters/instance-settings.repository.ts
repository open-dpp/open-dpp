import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { InstanceSettings } from "../../domain/instance-settings";
import { InstanceSettingsMapper } from "../mappers/instance-settings.mapper";
import { INSTANCE_SETTINGS_SCHEMA_VERSION, InstanceSettingsSchema } from "../schemas/instance-settings.schema";

@Injectable()
export class InstanceSettingsRepository {
  constructor(
    @InjectModel(InstanceSettingsSchema.name)
    private readonly model: Model<InstanceSettingsSchema>,
  ) {}

  async findOne(): Promise<InstanceSettings | null> {
    const document = await this.model.findOne();
    if (!document) {
      return null;
    }
    return InstanceSettingsMapper.toDomain(document);
  }

  async save(settings: InstanceSettings): Promise<InstanceSettings> {
    const plain = settings.toPlain();
    await this.model.findOneAndUpdate(
      { _id: plain.id },
      {
        $set: {
          signupEnabled: plain.signupEnabled,
          _schemaVersion: INSTANCE_SETTINGS_SCHEMA_VERSION,
        },
        $setOnInsert: {
          _id: plain.id,
        },
      },
      { upsert: true, new: true },
    );
    return settings;
  }
}
