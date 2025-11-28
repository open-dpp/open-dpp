import { AdministrativeInformationJsonSchema } from "../parsing/administrative-information-json-schema";
import { IVisitable, IVisitor } from "../visitor";

export class AdministrativeInformation implements IVisitable<any> {
  private constructor(public readonly version: string, public readonly revision: string) {
  }

  static create(data: { version: string; revision: string }): AdministrativeInformation {
    return new AdministrativeInformation(data.version, data.revision);
  }

  static fromPlain(json: Record<string, unknown>): AdministrativeInformation {
    return AdministrativeInformation.create(AdministrativeInformationJsonSchema.parse(json));
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitAdministrativeInformation(this);
  }
}
