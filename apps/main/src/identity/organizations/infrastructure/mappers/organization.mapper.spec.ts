import { expect } from "@jest/globals";
import { Organization } from "../../domain/organization";
import { OrganizationDocument } from "../schemas/organization.schema";
import { OrganizationMapper } from "./organization.mapper";

describe("organizationMapper", () => {
  const now = new Date();

  const validDomainOrganization = Organization.loadFromDb({
    id: "org-123",
    name: "Test Org",
    slug: "test-org",
    logo: "logo.png",
    metadata: { key: "value" },
    createdAt: now,
  });

  const validOrganizationDocument = {
    id: "org-123",
    name: "Test Org",
    slug: "test-org",
    logo: "logo.png",
    metadata: { key: "value" },
    createdAt: now,
  } as unknown as OrganizationDocument;

  const validBetterAuthOrganization = {
    id: "org-123",
    name: "Test Org",
    slug: "test-org",
    logo: "logo.png",
    metadata: { key: "value" },
    createdAt: now,
  };

  it("should map from domain to persistence", () => {
    const persistence = OrganizationMapper.toPersistence(validDomainOrganization);

    expect(persistence).toEqual({
      _id: validDomainOrganization.id,
      name: validDomainOrganization.name,
      slug: validDomainOrganization.slug,
      logo: validDomainOrganization.logo,
      metadata: validDomainOrganization.metadata,
      createdAt: validDomainOrganization.createdAt,
    });
  });

  it("should map from persistence to domain", () => {
    const domain = OrganizationMapper.toDomain(validOrganizationDocument);

    expect(domain).toBeInstanceOf(Organization);
    expect(domain.id).toBe(validOrganizationDocument.id);
    expect(domain.name).toBe(validOrganizationDocument.name);
    expect(domain.slug).toBe(validOrganizationDocument.slug);
  });

  it("should map from BetterAuth to domain", () => {
    const domain = OrganizationMapper.toDomainFromBetterAuth(validBetterAuthOrganization);

    expect(domain).toBeInstanceOf(Organization);
    expect(domain.id).toBe(validBetterAuthOrganization.id);
    expect(domain.name).toBe(validBetterAuthOrganization.name);
    expect(domain.slug).toBe(validBetterAuthOrganization.slug);
  });
});
