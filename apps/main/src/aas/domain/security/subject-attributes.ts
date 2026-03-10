import { DataTypeDef } from "@open-dpp/dto";
import { z } from "zod/v4";
import { UserRoleEnum } from "../../../identity/users/domain/user-role.enum";
import { Property } from "../submodel-base/property";

export const SubjectAttributesSchema = z.object({
  role: UserRoleEnum,
});

export class SubjectAttributes {
  private readonly subjectAttribute: Property[];
  private constructor(role: string) {
    this.subjectAttribute = [Property.create({ idShort: "role", valueType: DataTypeDef.String, value: role })];
  }

  static create(data: { role: string }): SubjectAttributes {
    return new SubjectAttributes(data.role);
  }

  static fromPlain(json: unknown): SubjectAttributes {
    const parsed = SubjectAttributesSchema.parse(json);
    return new SubjectAttributes(parsed.role);
  }

  get role(): string {
    return this.subjectAttribute.find(p => p.idShort === "role")!.value!;
  }

  isEqual(other: SubjectAttributes): boolean {
    return this.role === other.role;
  }
}
