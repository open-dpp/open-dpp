import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class AdministrativeInformationDoc {
  @Prop({ required: true })
  version: string;

  @Prop({ required: true })
  revision: string;
}

export const AdministrativeInformationSchema = SchemaFactory.createForClass(AdministrativeInformationDoc);
