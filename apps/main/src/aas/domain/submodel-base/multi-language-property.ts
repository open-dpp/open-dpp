import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { MultiLanguagePropertyJsonSchema } from "../parsing/submodel-base/multi-language-property-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class MultiLanguageProperty implements ISubmodelBase {
  private constructor(
    public readonly extensions: Extension[],
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: LanguageText[],
    public readonly valueId: Reference | null = null,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    extensions?: Extension[];
    value?: LanguageText[];
    valueId?: Reference | null;
  }) {
    return new MultiLanguageProperty(
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
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

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = MultiLanguagePropertyJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new MultiLanguageProperty(
      parsed.extensions.map(e => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.value.map(l => LanguageText.fromPlain(l)),
      parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitMultiLanguageProperty(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getChildren(): IterableIterator<ISubmodelBase> {
    yield* [];
  }
}
