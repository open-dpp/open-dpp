import type { AssetAdministrationShellType_TYPE } from "../domain/asset-administration-shell";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import {
  AssetAdministrationShellType,

} from "../domain/asset-administration-shell";

@Schema({ _id: false })
export class AasFieldAssignmentDoc {
  @Prop({ required: true })
  sectionId: string;

  @Prop({ required: true })
  dataFieldId: string;

  @Prop({ required: true })
  idShortParent: string;

  @Prop({ required: true })
  idShort: string;
}

export const AasFieldMappingSchema = SchemaFactory.createForClass(
  AasFieldAssignmentDoc,
);

export const AasConnectionDocSchemaVersion = {
  v1_0_0: "1.0.0",
} as const;

export type AasConnectionDocSchemaVersion_TYPE = keyof typeof AasConnectionDocSchemaVersion;

@Schema({ collection: "aas_mapping", timestamps: true })
export class AasConnectionDoc extends Document {
  @Prop({ required: true })
  // @ts-expect-error uses mongo id
  _id: string;

  @Prop({
    default: AasConnectionDocSchemaVersion.v1_0_0,
    enum: Object.values(AasConnectionDocSchemaVersion),
    type: String,
  }) // Track schema version
  _schemaVersion: AasConnectionDocSchemaVersion_TYPE;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  createdByUserId: string;

  @Prop({ required: true })
  ownedByOrganizationId: string;

  @Prop({ type: String, required: true })
  dataModelId: string;

  @Prop({ required: true, enum: AssetAdministrationShellType, type: String })
  aasType: AssetAdministrationShellType_TYPE;

  @Prop({ required: false, type: String })
  modelId: string | null;

  @Prop({ type: [AasFieldMappingSchema], default: [] })
  fieldAssignments: AasFieldAssignmentDoc[];
}
export const AasConnectionSchema
  = SchemaFactory.createForClass(AasConnectionDoc);

AasConnectionSchema.index({ ownedByOrganizationId: 1 });
