import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AssetKind } from "../../domain/asset-information";
import { ResourceDoc, ResourceSchema } from "./resource.schema";
import { SpecificAssetIdDoc, SpecificAssetIdSchema } from "./specific-asset-id.schema";

@Schema({ _id: false })
export class AssetInformationDoc {
  @Prop({ required: true, enum: AssetKind })
  assetKind: AssetKind;

  @Prop()
  globalAssetId?: string;

  @Prop({ type: [SpecificAssetIdSchema], default: [] })
  specificAssetIds?: SpecificAssetIdDoc[];

  @Prop()
  assetType?: string;

  @Prop({ type: ResourceSchema })
  defaultThumbnail?: ResourceDoc;
}

export const AssetInformationSchema = SchemaFactory.createForClass(AssetInformationDoc);
