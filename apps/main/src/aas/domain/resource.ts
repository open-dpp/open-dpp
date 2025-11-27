import { ResourceJsonSchema } from "./parsing/aas-json-schemas";
import { IVisitable, IVisitor } from "./visitor";

export class Resource implements IVisitable<any> {
  private constructor(
    public readonly path: string,
    public readonly contentType: string | null,
  ) {
  }

  static create(data: {
    path: string;
    contentType?: string;
  }) {
    return new Resource(
      data.path,
      data.contentType ?? null,
    );
  }

  static fromPlain(data: Record<string, unknown>): Resource {
    const parsed = ResourceJsonSchema.parse(data);
    return Resource.create({
      path: parsed.path,
      contentType: parsed.contentType,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitResource(this);
  }
}
