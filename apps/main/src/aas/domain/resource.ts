import { ResourceJsonSchema } from "@open-dpp/aas";
import { IVisitable, IVisitor } from "./visitor";

export class Resource implements IVisitable {
  private constructor(
    public readonly path: string,
    public readonly contentType: string | null,
  ) {
  }

  static create(data: {
    path: string;
    contentType?: string | null;
  }) {
    return new Resource(
      data.path,
      data.contentType ?? null,
    );
  }

  static fromPlain(data: unknown): Resource {
    const parsed = ResourceJsonSchema.parse(data);
    return new Resource(
      parsed.path,
      parsed.contentType ?? null,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitResource(this, context);
  }
}
