import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";
import { z } from "zod/v4";

export class AdministrativeInformation implements IVisitable {
  private constructor(
    public version: string,
    public readonly revision: string,
  ) {}

  static create(data: { version: string; revision: string }): AdministrativeInformation {
    return new AdministrativeInformation(data.version, data.revision);
  }

  static fromPlain(json: unknown): AdministrativeInformation {
    return AdministrativeInformation.create(AdministrativeInformationJsonSchema.parse(json));
  }

  increaseVersion() {
    const numericVersion = z.coerce.number().safeParse(this.version);
    if (numericVersion.success) {
      this.version = `${numericVersion.data + 1}`;
    }
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAdministrativeInformation(this, context);
  }

  toPlain(): Record<string, any> {
    return {
      version: this.version,
      revision: this.revision,
    };
  }
}
