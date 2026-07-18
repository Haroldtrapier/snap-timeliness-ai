import { describe, it, expect } from "vitest";
import {
  encodeSession,
  decodeSession,
  nameFromEmail,
  roleFromUserType,
  userTypeFromRole,
  type Session,
} from "@/lib/session";

describe("encode/decodeSession", () => {
  const session: Session = {
    id: "abc-123",
    email: "jane.doe@example.com",
    name: "Jane Doe",
    role: "applicant",
    userType: "applicant",
  };

  it("round-trips a valid session", () => {
    expect(decodeSession(encodeSession(session))).toEqual(session);
  });

  it("returns null for empty / undefined input", () => {
    expect(decodeSession(undefined)).toBeNull();
    expect(decodeSession(null)).toBeNull();
    expect(decodeSession("")).toBeNull();
  });

  it("returns null for malformed base64 / json", () => {
    expect(decodeSession("not-valid-base64url!!")).toBeNull();
    expect(decodeSession(Buffer.from("{not json").toString("base64url"))).toBeNull();
  });

  it("rejects a payload missing a valid role", () => {
    const bad = Buffer.from(JSON.stringify({ email: "x@y.com" })).toString("base64url");
    expect(decodeSession(bad)).toBeNull();
    const badRole = Buffer.from(
      JSON.stringify({ email: "x@y.com", role: "superuser" }),
    ).toString("base64url");
    expect(decodeSession(badRole)).toBeNull();
  });

  it("defaults missing optional fields without throwing", () => {
    const minimal = Buffer.from(
      JSON.stringify({ email: "x@y.com", role: "agency" }),
    ).toString("base64url");
    expect(decodeSession(minimal)).toEqual({
      id: "",
      email: "x@y.com",
      name: "",
      role: "agency",
      userType: undefined,
    });
  });
});

describe("nameFromEmail", () => {
  it("humanizes the local part", () => {
    expect(nameFromEmail("jane.doe@example.com", "applicant")).toBe("Jane Doe");
    expect(nameFromEmail("john_smith-jr@x.com", "agency")).toBe("John Smith Jr");
  });

  it("falls back by role when there is no local part", () => {
    expect(nameFromEmail("@x.com", "agency")).toBe("Agency User");
    expect(nameFromEmail("", "applicant")).toBe("Applicant");
  });
});

describe("roleFromUserType (security-relevant mapping)", () => {
  it("maps agency user types to the agency role", () => {
    for (const t of ["county", "state", "admin"]) {
      expect(roleFromUserType(t)).toBe("agency");
    }
  });

  it("maps everything else (and nullish) to applicant", () => {
    for (const t of ["applicant", "recipient", "navigator", "", "unknown"]) {
      expect(roleFromUserType(t)).toBe("applicant");
    }
    expect(roleFromUserType(null)).toBe("applicant");
    expect(roleFromUserType(undefined)).toBe("applicant");
  });
});

describe("userTypeFromRole", () => {
  it("is a sensible inverse for the two surfaces", () => {
    expect(userTypeFromRole("agency")).toBe("county");
    expect(userTypeFromRole("applicant")).toBe("applicant");
  });
});
