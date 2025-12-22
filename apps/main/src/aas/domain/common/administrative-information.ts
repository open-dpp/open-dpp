import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";

export class AdministrativeInformation implements IVisitable {
  private constructor(
    public readonly version: string,
    public readonly revision: string,
  ) {
  }

  static create(data: { version: string; revision: string }): AdministrativeInformation {
    return new AdministrativeInformation(data.version, data.revision);
  }

  static fromPlain(json: unknown): AdministrativeInformation {
    return AdministrativeInformation.create(AdministrativeInformationJsonSchema.parse(json));
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAdministrativeInformation(this, context);
  }
}
