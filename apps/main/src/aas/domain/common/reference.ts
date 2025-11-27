import { z } from "zod";
import { ReferenceJsonSchema } from "../parsing/reference-json-schema";
import { IVisitable, IVisitor } from "../visitor";
import { Key } from "./key";

export const ReferenceTypes = {
  ExternalReference: "ExternalReference",
  ModelReference: "ModelReference",
} as const;

export const ReferenceTypesEnum = z.enum(ReferenceTypes);
export type ReferenceTypesType = z.infer<typeof ReferenceTypesEnum>;

export class Reference implements IVisitable<any> {
  private constructor(public type: ReferenceTypesType, public referredSemanticId: Reference | null, public keys: Key[]) {
  }

  static create(data: { type: ReferenceTypesType; referredSemanticId?: Reference; keys: Key[] }): Reference {
    return new Reference(data.type, data.referredSemanticId ?? null, data.keys);
  }

  static fromPlain(json: Record<string, unknown>): Reference {
    const parsed = ReferenceJsonSchema.parse(json);
    return Reference.create({
      type: parsed.type,
      referredSemanticId: parsed.referredSemanticId ? Reference.fromPlain(parsed.referredSemanticId) : undefined,
      keys: parsed.keys.map(Key.fromPlain),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitReference(this);
  }
}
