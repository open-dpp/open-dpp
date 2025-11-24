import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { EntityType } from "../../../domain/submodelBase/entity";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SpecificAssetIdDoc, SpecificAssetIdSchema } from "../specific-asset-id.schema";
import { SubmodelBaseDoc, SubmodelBaseSchema } from "./submodel-base.schema";

export class EntityDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: EntityType })
  entityType: EntityType;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  statements?: SubmodelBaseDoc[];

  @Prop()
  globalAssetId?: string;

  @Prop({ type: [SpecificAssetIdSchema], default: [] })
  specificAssetIds?: SpecificAssetIdDoc[];
}

export const EntitySchema = SchemaFactory.createForClass(EntityDoc);
