import { Key } from "./key";

export class Reference {
  private constructor(public type: ReferenceTypes, public referredSemanticId: Reference | null, public keys: Key[]) {
  }

  static create(data: { type: ReferenceTypes; referredSemanticId?: Reference; keys: Key[] }): Reference {
    return new Reference(data.type, data.referredSemanticId ?? null, data.keys);
  }
}

export enum ReferenceTypes {
  ExternalReference = "ExternalReference",
  ModelReference = "ModelReference",
}
