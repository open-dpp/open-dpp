import { Buffer } from "node:buffer";
import { ValueError } from "@open-dpp/exception";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { BlobJsonSchema } from "../parsing/submodel-base/blob-json-schema";
import { IVisitor } from "../visitor";
import { AasSubmodelElements, AasSubmodelElementsType } from "./aas-submodel-elements";
import { ISubmodelElement, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Blob implements ISubmodelElement {
  private constructor(
    public readonly contentType: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Buffer | null = null,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    contentType: string;
    extensions?: Array<Extension>;
    value?: Buffer | null;
  }) {
    return new Blob(
      data.contentType,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? null,
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = BlobJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Blob(
      parsed.contentType,
      parsed.extensions.map(e => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.value ? Buffer.from(parsed.value) : undefined,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitBlob(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getSubmodelElements(): IterableIterator<ISubmodelElement> {
    yield* [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("Blob cannot contain submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Blob;
  }
}
