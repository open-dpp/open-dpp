import { Schema, SchemaFactory } from "@nestjs/mongoose";
import { PolicyDoc } from "./policy.schema";

@Schema({ collection: "limits", timestamps: true })
export class LimitDoc extends PolicyDoc {}

export const LimitSchema = SchemaFactory.createForClass(LimitDoc);
