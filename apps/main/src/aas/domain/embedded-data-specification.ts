import { Reference } from "./common/reference";
import { IVisitable, IVisitor } from "./visitor";
import { EmbeddedDataSpecificationJsonSchema } from "./zod-schemas";

export class EmbeddedDataSpecification implements IVisitable<any> {
  private constructor(
    public readonly dataSpecification: Reference,
  ) {
  }

  static create(data: {
    dataSpecification: Reference;
  }) {
    return new EmbeddedDataSpecification(
      data.dataSpecification,
    );
  }

  static fromPlain(json: Record<string, unknown>): EmbeddedDataSpecification {
    const parsed = EmbeddedDataSpecificationJsonSchema.parse(json);
    return EmbeddedDataSpecification.create({
      dataSpecification: Reference.fromPlain(parsed.dataSpecification),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitEmbeddedDataSpecification(this);
  }
}
