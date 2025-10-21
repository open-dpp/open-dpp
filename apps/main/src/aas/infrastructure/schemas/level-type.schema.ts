import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class LevelTypeDoc {
  @Prop({ required: true })
  min: boolean;

  @Prop({ required: true })
  nom: boolean;

  @Prop({ required: true })
  typ: boolean;

  @Prop({ required: true })
  max: boolean;
}

export const LevelTypeSchema = SchemaFactory.createForClass(LevelTypeDoc);
