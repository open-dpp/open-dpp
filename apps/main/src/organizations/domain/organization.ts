import { randomBytes } from "node:crypto";

export interface OrganizationCreateProps {
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: any;
}

export type OrganizationDbProps = OrganizationCreateProps & {
  id: string;
  createdAt: Date;
};

function generate24CharId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = randomBytes(8).toString("hex");
  return timestamp + random;
}

export class Organization {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly logo: string | null;
  public readonly metadata: any;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    name: string,
    slug: string,
    logo: string | null,
    metadata: any,
    createdAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.logo = logo;
    this.metadata = metadata;
    this.createdAt = createdAt;
  }

  public static create(data: OrganizationCreateProps) {
    const now = new Date();
    return new Organization(
      generate24CharId(),
      data.name,
      data.slug,
      data.logo ?? null,
      data.metadata ?? {},
      now,
    );
  }

  public static loadFromDb(data: OrganizationDbProps) {
    return new Organization(
      data.id,
      data.name,
      data.slug,
      data.logo ?? null,
      data.metadata ?? {},
      data.createdAt,
    );
  }
}
