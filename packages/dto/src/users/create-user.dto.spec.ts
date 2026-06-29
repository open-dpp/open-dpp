import { expect } from "@jest/globals";
import { CreateUserDtoSchema } from "./create-user.dto";

const validInput = {
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
};

describe("CreateUserDtoSchema", () => {
  it("parses a valid input", () => {
    const result = CreateUserDtoSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects an empty firstName", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a firstName longer than 100 characters", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, firstName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only firstName", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, firstName: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts a firstName of exactly 100 characters", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, firstName: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace from firstName", () => {
    const parsed = CreateUserDtoSchema.parse({ ...validInput, firstName: "  Florian  " });
    expect(parsed.firstName).toBe("Florian");
  });

  it("rejects an empty lastName", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a lastName longer than 100 characters", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, lastName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only lastName", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, lastName: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts a lastName of exactly 100 characters", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, lastName: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace from lastName", () => {
    const parsed = CreateUserDtoSchema.parse({ ...validInput, lastName: "  Bieck  " });
    expect(parsed.lastName).toBe("Bieck");
  });

  it("rejects an invalid email", () => {
    const result = CreateUserDtoSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const result = CreateUserDtoSchema.safeParse({ firstName: "Jane", lastName: "Doe" });
    expect(result.success).toBe(false);
  });
});
