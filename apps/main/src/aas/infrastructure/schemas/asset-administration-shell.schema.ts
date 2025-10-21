import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Reference } from "../../domain/common/reference";
import { AssetInformationDoc, AssetInformationSchema } from "./asset-information.schema";
import {
  AdministrativeInformationDoc,
  AdministrativeInformationSchema,
} from "./common/administration.information.schema";
import { LanguageTextDoc, LanguageTextSchema } from "./common/language.text.schema";
import { ReferenceDoc, ReferenceSchema } from "./common/reference.schema";
import { EmbeddedDataSpecificationDoc, EmbeddedDataSpecificationSchema } from "./embedded-data-specification.schema";
import { ExtensionDoc, ExtensionSchema } from "./extension.schema";
import { ResourceSchema } from "./resource.schema";

@Schema({ _id: false })
export class AssetAdministrationShellDoc {
  @Prop()
  id: string;

  @Prop({ required: true, type: AssetInformationSchema })
  assetInformation: AssetInformationDoc;

  @Prop({ type: [ExtensionSchema], default: [] })
  extensions?: ExtensionDoc[];

  @Prop()
  category?: string;

  @Prop()
  idShort?: string;

  @Prop({ type: [LanguageTextSchema], default: [] })
  displayName?: LanguageTextDoc[];

  @Prop({ type: [LanguageTextSchema], default: [] })
  description?: LanguageTextDoc[];

  @Prop({ type: [AdministrativeInformationSchema], default: [] })
  administration?: AdministrativeInformationDoc[];

  @Prop({ type: [EmbeddedDataSpecificationSchema], default: [] })
  embeddedDataSpecifications?: EmbeddedDataSpecificationDoc[];

  @Prop({ type: ResourceSchema })
  derivedFrom?: Reference;

  @Prop({ type: [ReferenceSchema], default: [] })
  submodels?: ReferenceDoc[];
}

export const AssetAdministrationShellSchema = SchemaFactory.createForClass(AssetAdministrationShellDoc);
