import { afterEach, describe, expect, it, vi } from "vitest";
import { enforceTmdbRateLimit, isTmdbNumericId } from "./tmdb-rate-limit";

describe("isTmdbNumericId", () => {
  it("accepts digit-only ids", () => {
    expect(isTmdbNumericId("42")).toBe(true);
    expect(isTmdbNumericId("0")).toBe(true);
  });

  it("rejects non-numeric or empty ids", () => {
    expect(isTmdbNumericId("")).toBe(false);
    expect(isTmdbNumericId("12a")).toBe(false);
    expect(isTmdbNumericId("../etc")).toBe(false);
  });
});

describe("enforceTmdbRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows bursts under the limit then returns 429", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const request = new Request("http://localhost/api/tmdb/search", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    }) as never;

    for (let i = 0; i < 60; i++) {
      expect(enforceTmdbRateLimit(request)).toBeNull();
    }

    const blocked = enforceTmdbRateLimit(request);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    await expect(blocked!.json()).resolves.toEqual({
      error: "Too many requests",
    });
  });
});
