import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { BlobJsonSchema } from "../parsing/submodel-base/blob-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Blob implements ISubmodelBase {
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
    public readonly value: Uint8Array | null = null,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    contentType: string;
    extensions?: Array<Extension>;
    value?: Uint8Array;
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

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = BlobJsonSchema.parse(data);
    return Blob.create({
      ...submodelBasePropsFromPlain(parsed),
      contentType: parsed.contentType,
      value: parsed.value ? new Uint8Array(atob(parsed.value).split("").map(c => c.charCodeAt(0))) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitBlob(this);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
