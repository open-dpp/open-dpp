import { BrandingDtoSchema } from "@open-dpp/dto";

export class Branding {
  private constructor(
    public readonly logo: string | null = null,
  ) {
  }

  static create(data: {
    logo?: string;
  }) {
    return new Branding(
      data.logo ?? null,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = BrandingDtoSchema.parse(data);
    return new Branding(
      parsed.logo ?? null,
    );
  }

  toPlain() {
    return {
      logo: this.logo,
    };
  }
}
