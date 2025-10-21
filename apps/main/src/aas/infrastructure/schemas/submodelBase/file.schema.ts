import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

export class FileDoc extends SubmodelBaseDoc {
  @Prop({ required: true })
  contentType: string;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  value?: string;
}

export const FileSchema = SchemaFactory.createForClass(FileDoc);
