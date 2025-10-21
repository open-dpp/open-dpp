import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DataTypeDef } from "../../../domain/common/data-type-def";
import { AasSubmodelElements } from "../../../domain/submodelBase/submodel";
import { ExtensionDoc, ExtensionSchema } from "../extension.schema";
import { SubmodelBaseDoc } from "./submodel.schema";

@Schema({ _id: false })
export class SubmodelElementListDoc extends SubmodelBaseDoc {
  @Prop({ required: true, enum: AasSubmodelElements })
  typeValueListElement: AasSubmodelElements;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  orderRelevant?: boolean;

  @Prop({ type: ReferenceSchema })
  semanticIdListElement?: Reference;

  @Prop({ enum: DataTypeDef })
  valueTypeListElement: DataTypeDef;

  @Prop({ type: [SubmodelBaseSchema], default: [] })
  value?: SubmodelBaseDoc[];
}

export const SubmodelElementListSchema = SchemaFactory.createForClass(SubmodelElementListDoc);
