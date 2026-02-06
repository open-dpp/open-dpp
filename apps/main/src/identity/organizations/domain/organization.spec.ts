import { expect } from "@jest/globals";

import { Organization } from "./organization";

describe("organization", () => {
  it("creates a organization and add members", () => {
    const organization = Organization.create({
      name: "Test Org",
      slug: "test-org",
      logo: null,
      metadata: {},
    });

    expect(organization.id).toBeDefined();
    expect(organization.name).toEqual("Test Org");
    expect(organization.slug).toEqual("test-org");
  });
});
