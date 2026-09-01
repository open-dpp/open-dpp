import { z } from "zod";

export const FieldMappingSchema = z.object({
  input: z.string(),
  output: z.string(),
});

export type PlainFieldMapping = z.infer<typeof FieldMappingSchema>;

export class FieldMapping {
  private constructor(
    public readonly inputPath: string,
    public readonly outputPath: string,
  ) {}
  static create(data: { input: string; output: string }) {
    return new FieldMapping(data.input, data.output);
  }

  static fromPlain(data: unknown): FieldMapping {
    const parsed = FieldMappingSchema.parse(data);
    return new FieldMapping(parsed.input, parsed.output);
  }

  toPlain(): PlainFieldMapping {
    return { input: this.inputPath, output: this.outputPath };
  }

  toJsonNata() {
    const keys = this.outputPath.split(".");
    let result: Record<string, any> = {};

    // Start from the innermost key and work backwards
    let current: Record<string, any> = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = {};
      current = current[key];
    }

    // Assign the input path as the value to the last key
    current[keys[keys.length - 1]] = new UnquotedValue(this.inputPath);

    return result;
  }
}

export class UnquotedValue {
  constructor(public value: string) {}
}
