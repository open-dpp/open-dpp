import { describe, expect, it } from "vitest";
import { idTokenClaims, profileClaims } from "./trusted-client-claims";

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

describe("idTokenClaims", () => {
  const user = {
    name: "Anna Maria de la Cruz",
    image: "https://cdn.example.com/anna.png",
    email: "anna@example.com",
    emailVerified: true,
    firstName: "Anna Maria",
    lastName: "de la Cruz",
    preferredLanguage: "de",
  };

  it("carries the display name, picture and e-mail next to the profile claims", () => {
    expect(idTokenClaims(user, ["openid", "profile", "email"])).toEqual({
      name: "Anna Maria de la Cruz",
      picture: "https://cdn.example.com/anna.png",
      email: "anna@example.com",
      email_verified: true,
      given_name: "Anna Maria",
      family_name: "de la Cruz",
      locale: "de",
    });
  });

  it("withholds the e-mail claims without the email scope", () => {
    expect(idTokenClaims(user, ["openid", "profile"])).toEqual({
      name: "Anna Maria de la Cruz",
      picture: "https://cdn.example.com/anna.png",
      given_name: "Anna Maria",
      family_name: "de la Cruz",
      locale: "de",
    });
  });

  it("withholds the profile claims without the profile scope", () => {
    expect(idTokenClaims(user, ["openid", "email"])).toEqual({
      email: "anna@example.com",
      email_verified: true,
    });
  });

  it("omits a missing picture and reports an unverified e-mail as such", () => {
    expect(
      idTokenClaims({ ...user, image: null, emailVerified: undefined }, [
        "openid",
        "profile",
        "email",
      ]),
    ).toEqual({
      name: "Anna Maria de la Cruz",
      email: "anna@example.com",
      email_verified: false,
      given_name: "Anna Maria",
      family_name: "de la Cruz",
      locale: "de",
    });
  });
});
