import { AdministrativeInformation } from "../common/administrative-information";
import { IHasDataSpecification } from "../common/has-data-specification";
import { ModellingKind } from "../common/has-kind";
import { IHasSemantics } from "../common/has-semantics";
import { KeyTypes } from "../common/key-types-enum";
import { LanguageText } from "../common/language-text";
import { IQualifiable, Qualifier } from "../common/qualififiable";
import { IReferable } from "../common/referable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { IPersistable } from "../IPersistable";
import { JsonVisitor } from "../parsing/json-visitor";
import { SubmodelJsonSchema } from "../parsing/submodel-base/submodel-json-schema";
import { IVisitable, IVisitor } from "../visitor";
import { parseSubmodelBaseUnion, SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export interface ISubmodelBase
  extends IReferable,
  IHasSemantics,
  IQualifiable,
  IVisitable<any>,
  IHasDataSpecification {
  // Intentionally empty.
}

export class Submodel extends SubmodelBase implements IPersistable {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    category: string | null,
    idShort: string | null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation,
    public readonly kind: ModellingKind | null,
    semanticId: Reference | null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Qualifier[],
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly submodelElements: Array<ISubmodelBase>,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(
    data: SubmodelBaseProps & {
      id: string;
      extensions?: Array<Extension>;
      administration: AdministrativeInformation;
      kind?: ModellingKind;
      submodelElements?: Array<ISubmodelBase>;
    },
  ) {
    return new Submodel(
      data.id,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.administration,
      data.kind ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.submodelElements ?? [],
    );
  };

  static fromPlain(data: Record<string, unknown>) {
    const parsed = SubmodelJsonSchema.parse(data);
    return Submodel.create({
      ...submodelBasePropsFromPlain(parsed),
      id: parsed.id,
      administration: AdministrativeInformation.fromPlain(parsed.administration),
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

registerSubmodel(KeyTypes.Submodel, Submodel);
