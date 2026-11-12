import { describe, expect, it } from "vitest";
import { updateUserNameSchema } from "./schemas";

describe("user name input", () => {
  it("trims whitespace and accepts reasonable names", () => {
    expect(updateUserNameSchema.parse({ name: "  Sam Rivera " })).toEqual({
      name: "Sam Rivera",
    });
    expect(updateUserNameSchema.parse({ name: "" }).name).toBe("");
  });

  it("rejects oversized names and unexpected fields", () => {
    expect(updateUserNameSchema.safeParse({ name: "x".repeat(51) }).success)
      .toBe(false);
    expect(
      updateUserNameSchema.safeParse({ name: "Sam", email: "a@b.c" }).success,
    ).toBe(false);
  });
});
