import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AssetAdministrationShellDoc, AssetAdministrationShellSchema } from "./asset-administration-shell.schema";
import { ConceptDescriptionDoc, ConceptDescriptionSchema } from "./concept-description.schema";
import { SubmodelDoc, SubmodelSchema } from "./submodel.schema";

@Schema({ _id: false })
export class EnvironmentDoc {
  @Prop({ type: [AssetAdministrationShellSchema], default: [] })
  assetAdministrationShells?: AssetAdministrationShellDoc;

  @Prop({ type: [SubmodelSchema], default: [] })
  submodels?: SubmodelDoc[];

  @Prop({ type: [ConceptDescriptionSchema], default: [] })
  conceptDescriptions?: Array<ConceptDescriptionDoc>;
}

export const EnvironmentSchema = SchemaFactory.createForClass(EnvironmentDoc);
