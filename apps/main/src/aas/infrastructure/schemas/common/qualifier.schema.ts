import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { DataTypeDef } from "../../../domain/common/data-type-def";
import { QualifierKind } from "../../../domain/common/qualififiable";
import { ReferenceDoc, ReferenceSchema } from "./reference.schema";

@Schema({ _id: false })
export class QualifierDoc {
  @Prop()
  type: string;

  @Prop({ required: true, enum: Object.values(DataTypeDef), type: String })
  valueType: DataTypeDef;

  @Prop({ type: ReferenceSchema })
  semanticId?: ReferenceDoc;

  @Prop({ type: [ReferenceSchema], default: [] })
  supplementalSemanticIds: ReferenceDoc[];

  @Prop({ required: true, enum: Object.values(QualifierKind), type: String })
  kind: QualifierKind;

  @Prop()
  value?: string;

  @Prop({ type: ReferenceSchema })
  valueId?: ReferenceDoc;
}

export const QualifierSchema = SchemaFactory.createForClass(QualifierDoc);
