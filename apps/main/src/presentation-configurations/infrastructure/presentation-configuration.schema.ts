import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  KeyTypes,
  PresentationComponentName,
  PresentationComponentNameType,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { Document } from "mongoose";

export const PresentationConfigurationDocVersion = {
  v1_0_0: "1.0.0",
} as const;
type PresentationConfigurationDocVersionType =
  (typeof PresentationConfigurationDocVersion)[keyof typeof PresentationConfigurationDocVersion];

const KEY_TYPES_VALUES: ReadonlySet<string> = new Set(Object.values(KeyTypes));
const PRESENTATION_COMPONENT_NAME_VALUES: ReadonlySet<string> = new Set(
  Object.values(PresentationComponentName),
);

function validatePresentationComponentMap(
  value: unknown,
  opts: { constrainKeys: boolean },
): boolean {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  for (const [key, componentName] of Object.entries(value as Record<string, unknown>)) {
    if (opts.constrainKeys && !KEY_TYPES_VALUES.has(key)) return false;
    if (typeof componentName !== "string") return false;
    if (!PRESENTATION_COMPONENT_NAME_VALUES.has(componentName)) return false;
  }
  return true;
}

@Schema({ collection: "presentation_configurations" })
export class PresentationConfigurationDoc extends Document<string> {
  @Prop({
    default: PresentationConfigurationDocVersion.v1_0_0,
    enum: Object.values(PresentationConfigurationDocVersion),
    type: String,
  })
  _schemaVersion: PresentationConfigurationDocVersionType;

  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  referenceId: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PresentationReferenceType),
  })
  referenceType: (typeof PresentationReferenceType)[keyof typeof PresentationReferenceType];

  @Prop({ type: String, default: null })
  label: string | null;

  @Prop({
    type: Object,
    required: true,
    default: {},
    validate: {
      validator: (v: unknown) => validatePresentationComponentMap(v, { constrainKeys: false }),
      message:
        "elementDesign must be a plain object whose values are registered PresentationComponentName entries.",
    },
  })
  elementDesign: Record<string, PresentationComponentNameType>;

  @Prop({
    type: Object,
    required: true,
    default: {},
    validate: {
      validator: (v: unknown) => validatePresentationComponentMap(v, { constrainKeys: true }),
      message:
        "defaultComponents keys must be KeyTypes and values must be registered PresentationComponentName entries.",
    },
  })
  defaultComponents: Partial<Record<string, PresentationComponentNameType>>;

  @Prop({ required: true, immutable: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const PresentationConfigurationSchema = SchemaFactory.createForClass(
  PresentationConfigurationDoc,
);

PresentationConfigurationSchema.index({ referenceType: 1, referenceId: 1, createdAt: 1 });
PresentationConfigurationSchema.index({ organizationId: 1, createdAt: -1, _id: -1 });
