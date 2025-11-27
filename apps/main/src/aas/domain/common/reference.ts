import { IVisitable, IVisitor } from "../visitor";
import { ReferenceJsonSchema } from "../zod-schemas";
import { Key } from "./key";

export enum ReferenceTypes {
  ExternalReference = "ExternalReference",
  ModelReference = "ModelReference",
}

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
