import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DbSessionOptions } from "../../../database/query-options";
import { convertToDomain, save } from "../../../lib/repositories";
import { InstanceSettings, InstanceSettingsDbProps } from "../../domain/instance-settings";
import {
  InstanceSettingsDocument,
  InstanceSettingsDocVersion,
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

  async findOne(options?: DbSessionOptions): Promise<InstanceSettings | null> {
    const document = await this.model.findOne().session(options?.session ?? null);
    if (!document) {
      return null;
    }
    return convertToDomain(document, this.fromPlain.bind(this));
  }

  async save(settings: InstanceSettings, options?: DbSessionOptions): Promise<InstanceSettings> {
    return await save(
      settings,
      this.model,
      InstanceSettingsDocVersion.v1_4_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }
}
