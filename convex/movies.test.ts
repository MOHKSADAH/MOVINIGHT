/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.*s");

describe("movies", () => {
  it("rejects upsertMovie when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.movies.upsertMovie, {
        tmdbId: 42,
        title: "Test",
        poster: "/placeholder.jpg",
        overview: "Overview",
        genres: ["Drama"],
        releaseYear: 2024,
      }),
    ).rejects.toThrow(/Not authenticated/i);
  });

  it("returns movies by tmdb id after insert", async () => {
    const t = convexTest(schema, modules);
    const movieId = await t.run(async (ctx) => {
      return await ctx.db.insert("movies", {
        tmdbId: 9001,
        title: "Inserted",
        poster: "/placeholder.jpg",
        overview: "Seeded for query",
        genres: ["Action"],
        releaseYear: 2020,
      });
    });

    const byId = await t.query(api.movies.getMovieById, { movieId });
    expect(byId?.title).toBe("Inserted");

    const byTmdb = await t.query(api.movies.getMovieByTmdbId, { tmdbId: 9001 });
    expect(byTmdb?._id).toEqual(movieId);
  });
});
