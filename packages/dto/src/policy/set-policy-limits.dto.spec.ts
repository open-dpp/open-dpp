import { PolicyKeyList, SetPolicyLimitsDtoSchema } from "./policy.dto";

describe("setPolicyLimitsDtoSchema", () => {
  it("accepts a single policy key", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({
      [PolicyKeyList.AI_TOKEN_QUOTA]: 1000,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ [PolicyKeyList.AI_TOKEN_QUOTA]: 1000 });
  });

  it("accepts several policy keys at once", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({
      [PolicyKeyList.AI_TOKEN_QUOTA]: 1000,
      [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500,
      [PolicyKeyList.PASSPORT_CREATE_LIMIT]: 0,
    });

    expect(result.success).toBe(true);
  });

  it("leaves unspecified keys out instead of demanding every key", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({
      [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500,
    });

    expect(result.success).toBe(true);
    expect(Object.keys(result.data!)).toEqual([PolicyKeyList.MEDIA_STORAGE_LIMIT]);
  });

  it("rejects an empty record", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe("At least one policy key must be provided");
  });

  it("rejects an unknown policy key", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({ NOT_A_POLICY: 10 });

    expect(result.success).toBe(false);
  });

  it("rejects a negative limit", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({
      [PolicyKeyList.AI_TOKEN_QUOTA]: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a fractional limit", () => {
    const result = SetPolicyLimitsDtoSchema.safeParse({
      [PolicyKeyList.AI_TOKEN_QUOTA]: 1.5,
    });

    expect(result.success).toBe(false);
  });
});
