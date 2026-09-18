import { describe, expect, it } from "@jest/globals";
import { assignOrganizationIdAsSlug } from "./organization-slug-hook";

const OBJECT_ID_HEX = /^[0-9a-f]{24}$/;

describe("assignOrganizationIdAsSlug", () => {
  it("returns an organization id and a slug equal to it", () => {
    const { data } = assignOrganizationIdAsSlug();

    expect(data.slug).toEqual(data.id);
  });

  it("mints a valid ObjectId hex string so Mongo stores a real ObjectId", () => {
    const { data } = assignOrganizationIdAsSlug();

    expect(data.id).toMatch(OBJECT_ID_HEX);
  });

  it("mints a fresh id on every call", () => {
    const first = assignOrganizationIdAsSlug().data.id;
    const second = assignOrganizationIdAsSlug().data.id;

    expect(first).not.toEqual(second);
  });
});
