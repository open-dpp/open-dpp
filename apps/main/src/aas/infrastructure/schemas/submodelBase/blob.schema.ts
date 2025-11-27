import { Buffer } from "node:buffer";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";

import { SubmodelBaseDoc } from "./submodel-base.schema";

@Schema({ _id: false })
export class BlobDoc extends SubmodelBaseDoc {
  @Prop({ required: true })
  contentType: string;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop({ type: Buffer })
  value?: Buffer;
}

export const BlobSchema = SchemaFactory.createForClass(BlobDoc);
