import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class DataValueDoc {
  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  value?: unknown;
  @Prop({ required: true, default: 0 })
  row: number;
  @Prop({ required: true })
  dataSectionId: string;
  @Prop({ required: true })
  dataFieldId: string;
}

export const DataValueSchema = SchemaFactory.createForClass(DataValueDoc);
