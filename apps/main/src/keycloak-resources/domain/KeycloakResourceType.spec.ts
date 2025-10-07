import { KeycloakResourceType } from "./KeycloakResourceType";

describe("keycloakResourceType", () => {
  it("should define the organization resource type", () => {
    expect(KeycloakResourceType.ORGANIZATION).toEqual("organization");
  });
});
