import { describe, expect, it } from "vitest";
import { isValidOrgCode, normalizeOrgCode } from "../convex/lib/orgConstants";

describe("org code helpers", () => {
  it("normalizes casing and strips invalid characters", () => {
    expect(normalizeOrgCode("  Weebs!! ")).toBe("weebs");
    expect(normalizeOrgCode("My_Org-2")).toBe("my_org-2");
  });

  it("validates length bounds after normalization", () => {
    expect(isValidOrgCode("ab")).toBe(false);
    expect(isValidOrgCode("abc")).toBe(true);
    expect(isValidOrgCode("a".repeat(32))).toBe(true);
    expect(isValidOrgCode("a".repeat(33))).toBe(false);
  });
});
