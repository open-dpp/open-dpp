import { Reference } from "./common/reference";
import { IVisitable, IVisitor } from "./visitor";

export interface IDataSpecificationContent {

}

export class EmbeddedDataSpecification implements IVisitable<any> {
  private constructor(
    public readonly dataSpecification: Reference,
    public readonly dataSpecificationContent: IDataSpecificationContent,
  ) {
  }

  static create(data: {
    dataSpecification: Reference;
    dataSpecificationContent: IDataSpecificationContent;
  }) {
    return new EmbeddedDataSpecification(
      data.dataSpecification,
      data.dataSpecificationContent,
    );
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitEmbeddedDataSpecification(this);
  }
}
