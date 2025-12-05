import { AdministrativeInformation } from "../common/administrative-information";
import { IHasDataSpecification } from "../common/has-data-specification";
import { ModellingKindType } from "../common/has-kind";
import { IHasSemantics } from "../common/has-semantics";
import { LanguageText } from "../common/language-text";
import { IQualifiable, Qualifier } from "../common/qualififiable";
import { IReferable } from "../common/referable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { SubmodelJsonSchema } from "../parsing/submodel-base/submodel-json-schema";
import { IPersistable } from "../persistable";
import { IVisitable, IVisitor } from "../visitor";
import { parseSubmodelBaseUnion, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export interface ISubmodelBase
  extends IReferable,
  IHasSemantics,
  IQualifiable,
  IVisitable<any>,
  IHasDataSpecification {
  category: string | null;
  idShort: string;
  displayName: Array<LanguageText>;
  description: Array<LanguageText>;
  semanticId: Reference | null;
  supplementalSemanticIds: Array<Reference>;
  qualifiers: Qualifier[];
  embeddedDataSpecifications: Array<EmbeddedDataSpecification>;
  toPlain: () => Record<string, any>;
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
      administration?: AdministrativeInformation;
      kind?: ModellingKindType;
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

  static fromPlain(data: unknown) {
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

  public addSubmodelElement(submodelElement: ISubmodelBase) {
    this.submodelElements.push(submodelElement);
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitSubmodel(this);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
