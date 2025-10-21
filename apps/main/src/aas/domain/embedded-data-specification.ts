import { Reference } from "./common/reference";

export interface IDataSpecificationContent {

}

export class EmbeddedDataSpecification {
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
}
