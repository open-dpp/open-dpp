import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ReferenceDoc, ReferenceSchema } from "./common/reference.schema";

@Schema({ _id: false })
export class DataSpecificationContentDoc {
  // Intentionally empty.
}

const DataSpecificationContentSchema = SchemaFactory.createForClass(DataSpecificationContentDoc);

@Schema({ _id: false })
export class EmbeddedDataSpecificationDoc {
  @Prop({ required: true, type: ReferenceSchema })
  dataSpecification: ReferenceDoc;

  @Prop({ required: true, type: DataSpecificationContentSchema })
  dataSpecificationContent: DataSpecificationContentDoc;
}

export const EmbeddedDataSpecificationSchema = SchemaFactory.createForClass(EmbeddedDataSpecificationDoc);
