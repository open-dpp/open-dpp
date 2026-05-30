import { BrandingDtoSchema } from "@open-dpp/dto";

export class Branding {
  private constructor(
    public readonly organizationId: string,
    public readonly logo: string | null = null,
    public readonly primaryColor: string | null = null,
    public readonly permalinkBaseUrl: string | null = null,
    public readonly gs1ResolverBaseUrl: string | null = null,
  ) {}

  static create(data: {
    organizationId: string;
    logo?: string;
    primaryColor?: string;
    permalinkBaseUrl?: string | null;
    gs1ResolverBaseUrl?: string | null;
  }) {
    return new Branding(
      data.organizationId,
      data.logo,
      data.primaryColor,
      data.permalinkBaseUrl ?? null,
      data.gs1ResolverBaseUrl ?? null,
    );
  }

  static getDefault() {
    return Branding.create({
      organizationId: "instance",
      logo: "/api/instance/logo",
      primaryColor: "#6BAD87",
    });
  }

  static fromPlain(data: unknown, organizationId: string) {
    const parsed = BrandingDtoSchema.parse(data);
    return new Branding(
      organizationId,
      parsed.logo ?? null,
      parsed.primaryColor ?? null,
      parsed.permalinkBaseUrl ?? null,
      parsed.gs1ResolverBaseUrl ?? null,
    );
  }

  static fromDb(data: {
    organizationId: string;
    logo?: string;
    primaryColor?: string;
    permalinkBaseUrl?: string | null;
    gs1ResolverBaseUrl?: string | null;
  }) {
    return new Branding(
      data.organizationId,
      data.logo,
      data.primaryColor,
      data.permalinkBaseUrl ?? null,
      data.gs1ResolverBaseUrl ?? null,
    );
  }

  toPlain() {
    return {
      organizationId: this.organizationId,
      logo: this.logo,
      primaryColor: this.primaryColor,
      permalinkBaseUrl: this.permalinkBaseUrl,
      gs1ResolverBaseUrl: this.gs1ResolverBaseUrl,
    };
  }
}
