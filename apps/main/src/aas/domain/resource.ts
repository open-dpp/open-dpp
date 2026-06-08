import { ResourceJsonSchema } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "./visitor";
import { ConvertToPlainOptions } from "./convertable-to-plain";

export class Resource implements IVisitable {
  private constructor(
    public readonly path: string,
    public readonly contentType: string | null,
  ) {}

  static create(data: { path: string; contentType?: string | null }) {
    return new Resource(data.path, data.contentType ?? null);
  }

  static fromPlain(data: unknown): Resource {
    const parsed = ResourceJsonSchema.parse(data);
    return new Resource(parsed.path, parsed.contentType ?? null);
  }

  equals(other: Resource): boolean {
    return this.path === other.path && this.contentType === other.contentType;
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitResource(this, context);
  }
  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      path: this.path,
      contentType: this.contentType,
    };
  }
}
