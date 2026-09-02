import { ObjectId } from "mongodb";
import { idFilter } from "./better-auth-id";

describe("idFilter", () => {
  it("matches both string and ObjectId forms for a valid ObjectId string", () => {
    const hex = "507f1f77bcf86cd799439011";
    expect(idFilter(hex)).toEqual({ $in: [hex, new ObjectId(hex)] });
  });

  it("wraps non-ObjectId strings in $eq to block operator injection", () => {
    expect(idFilter("some-better-auth-id")).toEqual({ $eq: "some-better-auth-id" });
  });
});
