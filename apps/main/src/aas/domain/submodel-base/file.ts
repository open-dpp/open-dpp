import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { FileJsonSchema } from "../parsing/submodel-base/file-json-schema";
import { IVisitor } from "../visitor";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class File extends SubmodelBase {
  private constructor(
    public readonly contentType: string,
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Array<Qualifier>,
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: string | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: SubmodelBaseProps & {
    contentType: string;
    extensions?: Array<Extension>;
    value?: string;
  }) {
    return new File(
      data.contentType,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? null,
    );
  }

  static fromPlain(data: unknown): SubmodelBase {
    const parsed = FileJsonSchema.parse(data);
    return File.create({
      ...submodelBasePropsFromPlain(parsed),
      contentType: parsed.contentType,
      value: parsed.value,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitFile(this);
  }
}
