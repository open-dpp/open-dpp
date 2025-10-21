import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class ResourceDoc {
  @Prop({ required: true })
  path: string;

  @Prop()
  contentType?: string;
}

export const ResourceSchema = SchemaFactory.createForClass(ResourceDoc);
