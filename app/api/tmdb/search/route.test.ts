import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tmdb-api-guard", () => ({
  guardTmdbApi: vi.fn(async () => null),
}));

import { GET } from "./route";
import { guardTmdbApi } from "@/lib/tmdb-api-guard";

describe("GET /api/tmdb/search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(guardTmdbApi).mockResolvedValue(null);
  });

  it("returns empty results when query is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/tmdb/search") as never,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ results: [] });
  });

  it("forwards TMDB failures with the upstream status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );

    const response = await GET(
      new Request("http://localhost/api/tmdb/search?query=matrix") as never,
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ results: [] });
  });

  it("returns TMDB payload on success and defaults language", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain("language=en-US");
      expect(url).toContain("query=dune");
      return Response.json({ results: [{ id: 1, title: "Dune" }] });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/api/tmdb/search?query=dune") as never,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [{ id: 1, title: "Dune" }],
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects overlong queries", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/tmdb/search?query=${"a".repeat(201)}`,
      ) as never,
    );
    expect(response.status).toBe(400);
  });
});
