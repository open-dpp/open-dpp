import { DataTypeDef, PropertyJsonSchema } from "@open-dpp/dto";
import { z } from "zod/v4";
import { Property } from "../submodel-base/property";

export const SubjectAttributesSchema = z.object({
  subjectAttribute: PropertyJsonSchema.array(),
});

export class SubjectAttributes {
  private readonly subjectAttribute: Property[];
  private constructor(subjectAttribute: Property[]) {
    this.subjectAttribute = subjectAttribute;
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
