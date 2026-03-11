import { DataTypeDef, PropertyJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { Property } from "../submodel-base/property";

export const SubjectAttributesSchema = z.object({
  subjectAttribute: PropertyJsonSchema.array(),
});

export class SubjectAttributes {
  private _subjectAttribute: Property[];
  private constructor(subjectAttribute: Property[]) {
    this.subjectAttribute = subjectAttribute;
  }

  set subjectAttribute(subjectAttribute: Property[]) {
    const role = subjectAttribute.find(p => p.idShort === "role");
    if (!role || role.valueType !== DataTypeDef.String || typeof role.value !== "string") {
      throw new ValueError("subjectAttribute.role must be a string Property");
    }
    this._subjectAttribute = subjectAttribute;
  }

  get subjectAttribute(): Property[] {
    return this._subjectAttribute;
  }

  static create(data: { role: string }): SubjectAttributes {
    return new SubjectAttributes([Property.create({ idShort: "role", valueType: DataTypeDef.String, value: data.role })]);
  }

  static fromPlain(json: unknown): SubjectAttributes {
    const parsed = SubjectAttributesSchema.parse(json);
    return new SubjectAttributes(parsed.subjectAttribute.map(Property.fromPlain) as Property[]);
  }

  toPlain(): Record<string, any> {
    return {
      subjectAttribute: this.subjectAttribute.map(p => p.toPlain()),
    };
  }

  get role(): string {
    return this.subjectAttribute.find(p => p.idShort === "role")!.value!;
  }

  isEqual(other: SubjectAttributes): boolean {
    return this.role === other.role;
  }
}
