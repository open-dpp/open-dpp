import {
  KeyTypes,
  KeyTypesType,
  ReferenceJsonSchema,
  ReferenceTypes,
  ReferenceTypesType,
} from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";
import { Key } from "./key";
import { IdShortPath } from "./id-short-path";
import { ValueError } from "@open-dpp/exception";

export class Reference implements IVisitable {
  private constructor(
    public type: ReferenceTypesType,
    public referredSemanticId: Reference | null,
    public keys: Key[],
  ) {}

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
      referredSemanticId: parsed.referredSemanticId
        ? Reference.fromPlain(parsed.referredSemanticId)
        : undefined,
      keys: parsed.keys.map(Key.fromPlain),
    });
  }

  toPlain(): Record<string, any> {
    return {
      type: this.type,
      referredSemanticId: this.referredSemanticId?.toPlain(),
      keys: this.keys.map((k) => k.toPlain()),
    };
  }

  addKey(key: Key): Reference {
    return Reference.fromPlain({ ...this.toPlain(), keys: [...this.keys, key] });
  }

  asIdShortPath(): IdShortPath {
    if (this.type !== ReferenceTypes.ModelReference) {
      throw new ValueError("Only ModelReference can be converted into IdShortPath");
    }
    return IdShortPath.fromSegments(this.keys.map((k) => k.value));
  }

  constructIdShortPathsForType(
    type: KeyTypesType,
    options?: { excludeSubmodel?: boolean },
  ): IdShortPath[] {
    const excludeSubmodel = options?.excludeSubmodel ?? false;
    if (this.type !== ReferenceTypes.ModelReference) {
      throw new ValueError("Only ModelReference can be constructed into IdShortPaths");
    }
    let idShortPath = IdShortPath.fromSegments([]);
    const result: IdShortPath[] = [];
    for (const key of this.keys) {
      if (excludeSubmodel && key.type === KeyTypes.Submodel) {
        continue;
      }
      idShortPath = idShortPath.addPathSegment(key.value);
      if (key.type === type) {
        result.push(idShortPath);
      }
    }
    return result;
  }

  equals(other: Reference): boolean {
    if (this.type !== other.type) {
      return false;
    }
    if (this.referredSemanticId === null && other.referredSemanticId !== null) {
      return false;
    }
    if (this.referredSemanticId !== null && other.referredSemanticId === null) {
      return false;
    }
    if (
      this.referredSemanticId !== null &&
      other.referredSemanticId !== null &&
      !this.referredSemanticId.equals(other.referredSemanticId)
    ) {
      return false;
    }
    if (this.keys.length !== other.keys.length) {
      return false;
    }
    return this.keys.every((key, index) => key.equals(other.keys[index]));
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitReference(this, context);
  }
}
