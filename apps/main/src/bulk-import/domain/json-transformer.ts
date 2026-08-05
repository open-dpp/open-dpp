import jsonata from "jsonata";
import { merge } from "lodash";
import { z } from "zod";
import { FieldMapping, FieldMappingSchema, UnquotedValue } from "./field-mapping";

export const JsonTransformerSchema = z.object({
  fieldMappings: FieldMappingSchema.array(),
});

export class JsonTransformer {
  private constructor(private fieldMappings: FieldMapping[]) {}
  static create(data: { fieldMappings?: FieldMapping[] }) {
    return new JsonTransformer(data.fieldMappings ?? []);
  }

  static fromPlain(data: unknown): JsonTransformer {
    const parsed = JsonTransformerSchema.parse(data);
    return new JsonTransformer(parsed.fieldMappings.map((mapping) => FieldMapping.create(mapping)));
  }

  addFieldMapping(mapping: FieldMapping) {
    this.fieldMappings.push(mapping);
  }

  toPlain() {
    return { fieldMappings: this.fieldMappings.map((mapping) => mapping.toPlain()) };
  }

  async apply(input: any) {
    let jsonataExpression: Record<string, any> = {};

    for (const mapping of this.fieldMappings) {
      jsonataExpression = merge(jsonataExpression, mapping.toJsonNata());
    }
    return await jsonata(this.buildJsonataString(jsonataExpression)).evaluate(input);
  }

  static async evaluatePath(path: string, input: unknown): Promise<unknown> {
    return await jsonata(path).evaluate(input);
  }

  private buildJsonataString(obj: Record<string, any>): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";

    const parts = entries.map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        if (value instanceof UnquotedValue) {
          // Handle unquoted values (e.g., path expressions)
          return `"${key}": ${value.value}`;
        } else {
          // Recursively process nested objects
          return `"${key}": ${this.buildJsonataString(value)}`;
        }
      } else {
        // Quote primitive values (e.g., strings, numbers)
        return `"${key}": "${value}"`;
      }
    });

    return `{ ${parts.join(", ")} }`;
  }
}
