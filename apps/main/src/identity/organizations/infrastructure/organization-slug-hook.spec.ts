import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import { assignOrganizationSlugAsId } from "./organization-slug-hook";

describe("assignOrganizationSlugAsId", () => {
  it("uses the incoming slug as the organization id", () => {
    const slug = new ObjectId().toHexString();

    const { data } = assignOrganizationSlugAsId(slug);

    expect(data).toEqual({ id: slug, slug });
  });

  it("rejects a missing slug", () => {
    expect(() => assignOrganizationSlugAsId(undefined)).toThrow(ValueError);
  });

  it("rejects a slug that is not an ObjectId hex string", () => {
    expect(() => assignOrganizationSlugAsId(randomUUID())).toThrow(ValueError);
  });
});
