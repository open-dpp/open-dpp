import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

// Define a minimal interface to decouple from specific Zod types
type SafeParseable = {
  safeParse: (
    value: unknown,
  ) => { success: true; data: unknown } | { success: false; error: any };
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: SafeParseable) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues;
      throw new BadRequestException({
        message: 'Validation failed',
        errors: issues,
      });
    }
    return result.data;
  }
}
