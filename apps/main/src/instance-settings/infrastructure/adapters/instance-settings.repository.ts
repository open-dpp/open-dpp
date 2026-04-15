import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { convertToDomain, save } from "../../../lib/repositories";
import { InstanceSettings, InstanceSettingsDbProps } from "../../domain/instance-settings";
import {
  INSTANCE_SETTINGS_SCHEMA_VERSION,
  InstanceSettingsDocument,
  InstanceSettingsSchema,
} from "../schemas/instance-settings.schema";

@Injectable()
export class InstanceSettingsRepository {
  constructor(
    @InjectModel(InstanceSettingsSchema.name)
    private readonly model: Model<InstanceSettingsDocument>,
  ) {}

  async fromPlain(plain: unknown) {
    return InstanceSettings.loadFromDb(plain as InstanceSettingsDbProps);
  }

  async findOne(): Promise<InstanceSettings | null> {
    const document = await this.model.findOne();
    if (!document) {
      return null;
    }
    return convertToDomain(document, this.fromPlain.bind(this));
  }

  async save(settings: InstanceSettings): Promise<InstanceSettings> {
    return await save(
      settings,
      this.model,
      INSTANCE_SETTINGS_SCHEMA_VERSION,
      this.fromPlain.bind(this),
    );
  }
}
