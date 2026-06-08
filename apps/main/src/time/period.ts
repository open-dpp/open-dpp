import { z } from "zod/v4";
import { ValueError } from "@open-dpp/exception";

export class Period {
  private constructor(
    public readonly start: Date | null,
    public readonly end: Date | null,
  ) {
    if (start && end && start > end) {
      throw new ValueError("Start date must be before end date");
    }
    if (!start && !end) {
      throw new ValueError("Either start or end date must be provided");
    }
  }
  static create(data: { start?: Date; end?: Date }) {
    return new Period(data.start ?? null, data.end ?? null);
  }
  static fromIso(data: { start?: string; end?: string }): Period {
    return new Period(
      data.start ? new Date(z.iso.datetime().parse(data.start)) : null,
      data.end ? new Date(z.iso.datetime().parse(data.end)) : null,
    );
  }
}
