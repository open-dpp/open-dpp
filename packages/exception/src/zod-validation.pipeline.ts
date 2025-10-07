import type {
  PipeTransform,
} from '@nestjs/common'
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'

// Define a minimal interface to decouple from specific Zod types
interface SafeParseable {
  safeParse: (
    value: unknown,
  ) => { success: true, data: unknown } | { success: false, error: any }
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private schema: SafeParseable

  constructor(schema: SafeParseable) {
    this.schema = schema
  }

  transform(value: unknown) {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      const issues = (result as { success: false, error: any }).error.issues
      throw new BadRequestException({
        message: 'Validation failed',
        errors: issues,
      })
    }
    return result.data
  }
}
