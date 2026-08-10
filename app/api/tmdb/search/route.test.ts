import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/tmdb/search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
});
