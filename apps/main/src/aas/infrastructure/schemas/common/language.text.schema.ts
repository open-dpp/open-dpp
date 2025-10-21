import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class LanguageTextDoc {
  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  text: string;
}

export const LanguageTextSchema = SchemaFactory.createForClass(LanguageTextDoc);
