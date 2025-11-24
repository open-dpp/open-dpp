import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from "mongoose";
import { ReferenceTypes } from "../../../domain/common/reference";
import { KeyDoc, KeySchema } from "./key.schema";

@Schema({ _id: false })
export class ReferenceDoc {
  @Prop({ required: true, enum: Object.values(ReferenceTypes), type: String })
  type: ReferenceTypes;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "ReferenceDoc" })
  referredSemanticId: ReferenceDoc;

  @Prop({ type: [KeySchema], default: [] })
  keys: KeyDoc[];
}

export const ReferenceSchema = SchemaFactory.createForClass(ReferenceDoc);
