import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DataTypeDef } from "../../../domain/common/data-type-def";
import { AasSubmodelElements } from "../../../domain/submodelBase/aas-submodel-elements";
import { ReferenceDoc, ReferenceSchema } from "../common/reference.schema";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc, SubmodelBaseSchema } from "./submodel-base.schema";

@Schema({ _id: false })
export class SubmodelElementListDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: Object.values(AasSubmodelElements), type: String })
  typeValueListElement: AasSubmodelElements;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  orderRelevant?: boolean;

  @Prop({ type: ReferenceSchema })
  semanticIdListElement?: ReferenceDoc;

  @Prop({ enum: Object.values(DataTypeDef), type: String })
  valueTypeListElement: DataTypeDef;

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  value?: SubmodelBaseDoc[];
}

export const SubmodelElementListSchema = SchemaFactory.createForClass(SubmodelElementListDoc);
