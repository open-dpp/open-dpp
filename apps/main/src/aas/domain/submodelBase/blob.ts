import { KeyTypes } from "../common/key";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { IVisitor } from "../visitor";
import { BlobJsonSchema } from "../zod-schemas";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export class Blob extends SubmodelBase {
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
    public readonly value: Uint8Array | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
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

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
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
}

registerSubmodel(KeyTypes.Blob, Blob);
