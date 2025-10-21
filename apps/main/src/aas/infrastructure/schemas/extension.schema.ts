import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ReferenceDoc, ReferenceSchema } from "./common/reference.schema";

@Schema({ _id: false })
export class ExtensionDoc {
  @Prop({ required: true })
  name: string;

  @Prop({ type: ReferenceSchema })
  semanticId?: ReferenceDoc;

  @Prop({ type: [ReferenceSchema], default: [] })
  supplementalSemanticIds?: ReferenceDoc[];

  @Prop()
  valueType?: string; // Assuming DataTypeDef is a string enum, adjust if different

  @Prop()
  value?: string;

  @Prop({ type: [ReferenceSchema], default: [] })
  refersTo?: ReferenceDoc[];
}

export const ExtensionSchema = SchemaFactory.createForClass(ExtensionDoc);
