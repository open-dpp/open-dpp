import { randomUUID } from "node:crypto";
import { BrandingDtoSchema } from "@open-dpp/dto";

export class Branding {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly logo: string | null = null,
    public readonly primaryColor: string | null = null,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    logo?: string;
    primaryColor?: string;
  }) {
    return new Branding(
      data.id ?? randomUUID(),
      data.organizationId,
      data.logo ?? null,
      data.primaryColor ?? null,
    );
  }

  static loadFromDb(data: {
    _id: string;
    organizationId: string;
    logo?: string;
    primaryColor?: string;
  }) {
    return new Branding(data._id, data.organizationId, data.logo, data.primaryColor);
  }

  static fromPlain(data: unknown, organizationId: string) {
    const parsed = BrandingDtoSchema.parse(data);
    return new Branding(
      randomUUID(),
      organizationId,
      parsed.logo ?? null,
      parsed.primaryColor ?? null,
    );
  }

  static getDefault() {
    return this.create({
      organizationId: "instance",
      logo: "/api/instance/logo",
      primaryColor: "#6BAD87",
    });
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      logo: this.logo,
      primaryColor: this.primaryColor,
    };
  }

  toDb() {
    return {
      organizationId: this.organizationId,
      logo: this.logo,
      primaryColor: this.primaryColor,
    };
  }
}
