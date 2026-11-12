import { describe, expect, it } from "vitest";
import {
  emailTokenRequestSchema,
  emailTokenVerifySchema,
  revokeSessionSchema,
} from "./schemas";
import { isSameOrigin } from "@/lib/http";

describe("email token input", () => {
  it("trims and accepts a valid email address", () => {
    expect(emailTokenRequestSchema.parse({ email: " person@example.com " }))
      .toEqual({ email: "person@example.com" });
  });

  it("rejects malformed addresses and unexpected fields", () => {
    expect(emailTokenRequestSchema.safeParse({ email: "not-an-email" }).success)
      .toBe(false);
    expect(
      emailTokenRequestSchema.safeParse({
        email: "person@example.com",
        userId: "untrusted",
      }).success,
    ).toBe(false);
  });
});

describe("email token verification input", () => {
  it("accepts only six numeric digits and a valid Appwrite user ID", () => {
    expect(
      emailTokenVerifySchema.safeParse({
        userId: "user-123",
        secret: "001234",
      }).success,
    ).toBe(true);
    expect(
      emailTokenVerifySchema.safeParse({
        userId: "user-123",
        secret: "12345",
      }).success,
    ).toBe(false);
    expect(
      emailTokenVerifySchema.safeParse({
        userId: "bad/id",
        secret: "123456",
      }).success,
    ).toBe(false);
  });
});

describe("same-origin request guard", () => {
  it("accepts same-origin requests and rejects missing or foreign origins", () => {
    const url = "https://mono.example/api/auth/logout";
    expect(
      isSameOrigin(
        new Request(url, { method: "POST", headers: { origin: "https://mono.example" } }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Request(url, { method: "POST", headers: { origin: "https://other.example" } }),
      ),
    ).toBe(false);
    expect(isSameOrigin(new Request(url, { method: "POST" }))).toBe(false);
  });
});

describe("session revocation input", () => {
  it("accepts a session ID and rejects malformed IDs", () => {
    expect(revokeSessionSchema.safeParse({ sessionId: "session-123" }).success)
      .toBe(true);
    expect(revokeSessionSchema.safeParse({ sessionId: "../other" }).success)
      .toBe(false);
  });
});

