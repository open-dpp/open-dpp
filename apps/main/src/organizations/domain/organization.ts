import { randomUUID } from "node:crypto";

export class Organization {
  readonly id: string = randomUUID();
  readonly name: string = "";
  readonly slug: string = "";
  readonly logo: string | null = null;
  readonly metadata: any = {};
  readonly createdAt: Date = new Date();

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
}
