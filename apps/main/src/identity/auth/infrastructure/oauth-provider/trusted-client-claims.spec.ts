import { describe, expect, it } from "@jest/globals";
import { profileClaims } from "./trusted-client-claims";

describe("profileClaims", () => {
  const user = { firstName: "Anna Maria", lastName: "de la Cruz", preferredLanguage: "de" };

  it("maps first name, last name and preferred language to the OIDC profile claims", () => {
    expect(profileClaims(user, ["openid", "profile", "email"])).toEqual({
      given_name: "Anna Maria",
      family_name: "de la Cruz",
      locale: "de",
    });
  });

  it("returns nothing without the profile scope", () => {
    expect(profileClaims(user, ["openid", "email"])).toEqual({});
  });

  it("omits claims whose source is missing instead of emitting null", () => {
    expect(
      profileClaims({ firstName: null, lastName: "Solo", preferredLanguage: undefined }, [
        "profile",
      ]),
    ).toEqual({
      family_name: "Solo",
    });
  });
});
