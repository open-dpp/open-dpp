import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { MultiLanguagePropertyJsonSchema } from "../parsing/submodel-base/multi-language-property-json-schema";
import { IVisitor } from "../visitor";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class MultiLanguageProperty extends SubmodelBase {
  private constructor(
    public readonly extensions: Extension[],
    category: string | null = null,
    idShort: string | null = null,
    displayName: LanguageText[],
    description: LanguageText[],
    semanticId: Reference | null = null,
    supplementalSemanticIds: Reference[],
    qualifiers: Qualifier[],
    embeddedDataSpecifications: EmbeddedDataSpecification[],
    public readonly value: LanguageText[],
    public readonly valueId: Reference | null = null,
  ) {
    super(
      category,
      idShort,
      displayName,
      description,
      semanticId,
      supplementalSemanticIds,
      qualifiers,
      embeddedDataSpecifications,
    );
  }

  static create(data: SubmodelBaseProps & {
    extensions?: Extension[];
    value?: LanguageText[];
    valueId?: Reference;
  }) {
    return new MultiLanguageProperty(
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? [],
      data.valueId ?? null,
    );
  }

  static fromPlain(data: unknown): SubmodelBase {
    const parsed = MultiLanguagePropertyJsonSchema.parse(data);
    return MultiLanguageProperty.create({
      ...submodelBasePropsFromPlain(parsed),
      extensions: parsed.extensions.map(e => Extension.fromPlain(e)),
      value: parsed.value.map(l => LanguageText.fromPlain(l)),
      valueId: parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitMultiLanguageProperty(this);
  }
}
