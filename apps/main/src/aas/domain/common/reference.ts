import { z } from "zod";
import { ReferenceJsonSchema } from "../parsing/common/reference-json-schema";
import { IVisitable, IVisitor } from "../visitor";
import { Key } from "./key";

export const ReferenceTypes = {
  ExternalReference: "ExternalReference",
  ModelReference: "ModelReference",
} as const;

export const ReferenceTypesEnum = z.enum(ReferenceTypes);
export type ReferenceTypesType = z.infer<typeof ReferenceTypesEnum>;

export class Reference implements IVisitable {
  private constructor(
    public type: ReferenceTypesType,
    public referredSemanticId: Reference | null,
    public keys: Key[],
  ) {
  }

  static create(data: {
    type: ReferenceTypesType;
    referredSemanticId?: Reference | null;
    keys: Key[];
  }): Reference {
    return new Reference(data.type, data.referredSemanticId ?? null, data.keys);
  }

  static fromPlain(json: unknown): Reference {
    const parsed = ReferenceJsonSchema.parse(json);
    return Reference.create({
      type: parsed.type,
      referredSemanticId: parsed.referredSemanticId ? Reference.fromPlain(parsed.referredSemanticId) : undefined,
      keys: parsed.keys.map(Key.fromPlain),
    });
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitReference(this, context);
  }
}
