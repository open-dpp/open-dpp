import { EmbeddedDataSpecificationJsonSchema } from "@open-dpp/aas";
import { Reference } from "./common/reference";
import { IVisitable, IVisitor } from "./visitor";

export class EmbeddedDataSpecification implements IVisitable {
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

  static fromPlain(json: unknown): EmbeddedDataSpecification {
    const parsed = EmbeddedDataSpecificationJsonSchema.parse(json);
    return new EmbeddedDataSpecification(
      Reference.fromPlain(parsed.dataSpecification),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitEmbeddedDataSpecification(this, context);
  }
}
