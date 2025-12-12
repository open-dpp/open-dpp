import { AdministrativeInformation } from "../common/administrative-information";
import { IHasDataSpecification } from "../common/has-data-specification";
import { ModellingKindType } from "../common/has-kind";
import { IHasSemantics } from "../common/has-semantics";
import { LanguageText } from "../common/language-text";
import { IQualifiable, Qualifier } from "../common/qualififiable";
import { IReferable } from "../common/referable";
import { Reference } from "../common/reference";
import { IConvertableToPlain } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { SubmodelJsonSchema } from "../parsing/submodel-base/submodel-json-schema";
import { IPersistable } from "../persistable";
import { ValueVisitor } from "../value-visitor";
import { IVisitable, IVisitor } from "../visitor";
import { parseSubmodelBaseUnion, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class IdShortPath {
  constructor(private readonly _segments: Array<string>) {
  }

  static create(data: { path: string }): IdShortPath {
    return new IdShortPath(data.path.split("."));
  }

  addPathSegment(segment: string) {
    this._segments.push(segment);
  }

  get segments(): IterableIterator<string> {
    return this._segments[Symbol.iterator]();
  }

  toString(): string {
    return this._segments.join(".");
  }
}

export interface ISubmodelBase
  extends IReferable,
  IHasSemantics,
  IQualifiable,
  IVisitable,
  IHasDataSpecification, IConvertableToPlain {
  category: string | null;
  idShort: string;
  displayName: Array<LanguageText>;
  description: Array<LanguageText>;
  semanticId: Reference | null;
  supplementalSemanticIds: Array<Reference>;
  qualifiers: Qualifier[];
  embeddedDataSpecifications: Array<EmbeddedDataSpecification>;
  getChildren: () => IterableIterator<ISubmodelBase>;
}

export class Submodel implements ISubmodelBase, IPersistable {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation | null,
    public readonly kind: ModellingKindType | null,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly submodelElements: Array<ISubmodelBase>,
  ) {
  }

  static create(
    data: SubmodelBaseProps & {
      id: string;
      extensions?: Array<Extension>;
      administration?: AdministrativeInformation | null;
      kind?: ModellingKindType | null;
      submodelElements?: Array<ISubmodelBase>;
    },
  ) {
    return new Submodel(
      data.id,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.administration ?? null,
      data.kind ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.submodelElements ?? [],
    );
  };

  static fromPlain(data: unknown): Submodel {
    const parsed = SubmodelJsonSchema.parse(data);
    return Submodel.create({
      ...submodelBasePropsFromPlain(parsed),
      id: parsed.id,
      administration: parsed.administration ? AdministrativeInformation.fromPlain(parsed.administration) : undefined,
      kind: parsed.kind,
      extensions: parsed.extensions.map(x => Extension.fromPlain(x)),
      submodelElements: parsed.submodelElements.map(parseSubmodelBaseUnion),
    });
  };

  getValueRepresentation() {
    const valueVisitor = new ValueVisitor();
    return this.accept(valueVisitor);
  }

  findSubmodelElement(idShortPath: IdShortPath): ISubmodelBase | undefined {
    let current: ISubmodelBase | undefined;

    let children = [...this.getChildren()];

    for (const segment of idShortPath.segments) {
      current = children.find(el => el.idShort === segment);
      if (!current) {
        return undefined; // path broken
      }
      children = [...current.getChildren()]; // descend
    }

    return current;
  }

  public addSubmodelElement(submodelElement: ISubmodelBase) {
    this.submodelElements.push(submodelElement);
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodel(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getChildren(): IterableIterator<ISubmodelBase> {
    yield* this.submodelElements;
  }
}
