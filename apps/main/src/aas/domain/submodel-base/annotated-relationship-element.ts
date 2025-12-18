import { AasSubmodelElements, AasSubmodelElementsType, AnnotatedRelationshipElementJsonSchema } from "@open-dpp/aas";
import { ValueError } from "@open-dpp/exception";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../json-visitor";
import { IVisitor } from "../visitor";
import { IRelationshipElement } from "./relationship-element";
import {
  ISubmodelElement,
  parseSubmodelBaseUnion,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export class AnnotatedRelationshipElement implements ISubmodelElement, IRelationshipElement {
  protected constructor(
    public readonly first: Reference,
    public readonly second: Reference,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly annotations: Array<ISubmodelElement>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    first: Reference;
    second: Reference;
    extensions?: Array<Extension>;
    annotations?: Array<ISubmodelElement>;
  }) {
    return new AnnotatedRelationshipElement(
      data.first,
      data.second,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.annotations ?? [],
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = AnnotatedRelationshipElementJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new AnnotatedRelationshipElement(
      Reference.fromPlain(parsed.first),
      Reference.fromPlain(parsed.second),
      parsed.extensions.map(e => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.annotations.map(parseSubmodelBaseUnion),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAnnotatedRelationshipElement(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getSubmodelElements(): IterableIterator<ISubmodelElement> {
    yield* this.annotations;
  }

  addSubmodelElement(submodelElement: ISubmodelElement): ISubmodelElement {
    if (this.annotations.some(e => e.idShort === submodelElement.idShort)) {
      throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
    }
    this.annotations.push(submodelElement);
    return submodelElement;
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.AnnotatedRelationshipElement;
  }
}
