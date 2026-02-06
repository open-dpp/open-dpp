import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) { }

  transform(value: unknown, _: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    }
    catch {
      throw new BadRequestException("Validation failed");
    }
  }
}
