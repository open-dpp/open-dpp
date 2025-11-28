import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export const EnvironmentDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type EnvironmentDocVersionType = (typeof EnvironmentDocVersion)[keyof typeof EnvironmentDocVersion];

@Schema({ id: false })
export class EnvironmentDoc {
  @Prop({
    default: EnvironmentDocVersion.v1_0_0,
    enum: Object.values(EnvironmentDocVersion),
    type: String,
  })
  _schemaVersion: EnvironmentDocVersionType;

  @Prop({ type: [String], ref: "AssetAdministrationShellDoc", required: true })
  assetAdministrationShells: string[];

  @Prop({ type: [String], ref: "SubmodelDoc", required: true })
  submodels: string[];

  @Prop({ type: [String], ref: "ConceptDescriptionDoc", required: true })
  conceptDescriptions: string;
}

export const EnvironmentSchema = SchemaFactory.createForClass(EnvironmentDoc);
