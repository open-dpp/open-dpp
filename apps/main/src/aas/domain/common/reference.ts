import { z } from "zod/v4";
import { IVisitable, IVisitor } from "../visitor";
import { Key, KeyJsonSchema } from "./key";

export enum ReferenceTypes {
  ExternalReference = "ExternalReference",
  ModelReference = "ModelReference",
}

export const ReferenceJsonSchema = z.object({
  type: z.enum(ReferenceTypes),
  get referredSemanticId() { return ReferenceJsonSchema.optional(); },
  keys: z.array(KeyJsonSchema),
});

export class Reference implements IVisitable<any> {
  private constructor(public type: ReferenceTypes, public referredSemanticId: Reference | null, public keys: Key[]) {
  }

  static create(data: { type: ReferenceTypes; referredSemanticId?: Reference; keys: Key[] }): Reference {
    return new Reference(data.type, data.referredSemanticId ?? null, data.keys);
  }

  static fromPlain(json: Record<string, unknown>): Reference {
    const parsed = ReferenceJsonSchema.parse(json);
    return Reference.create({
      type: parsed.type,
      referredSemanticId: parsed.referredSemanticId ? Reference.fromPlain(parsed.referredSemanticId) : undefined,
      keys: parsed.keys.map(k => Key.fromPlain(k)),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitReference(this);
  }
}
