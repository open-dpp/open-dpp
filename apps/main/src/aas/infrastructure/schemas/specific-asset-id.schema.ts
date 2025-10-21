import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ReferenceDoc, ReferenceSchema } from "./common/reference.schema";

@Schema({ _id: false })
export class SpecificAssetIdDoc {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop({ type: ReferenceSchema })
  semanticId?: ReferenceDoc;

  @Prop({ type: [ReferenceSchema], default: [] })
  supplementalSemanticIds?: ReferenceDoc[];

  @Prop({ type: ReferenceSchema })
  externalSubjectId?: ReferenceDoc;
}

export const SpecificAssetIdSchema = SchemaFactory.createForClass(SpecificAssetIdDoc);
