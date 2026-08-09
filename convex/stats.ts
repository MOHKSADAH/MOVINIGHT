import { query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveOrgContext } from "./lib/customFunctions";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

type UserRef = {
  _id: Id<"users">;
  name: string;
  image?: string;
  avatar?: string;
};

function userRef(user: Doc<"users"> | null): UserRef | null {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name ?? "Unknown",
    image: user.image,
    avatar: user.avatar,
  };
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function loadOrgStatsBundle(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
) {
  const memberships = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();
  const users = (
    await Promise.all(memberships.map((m) => ctx.db.get(m.userId)))
  ).filter((u): u is Doc<"users"> => !!u && u.deletedAt === undefined);

  const [watched, nights, watchlist] = await Promise.all([
    ctx.db
      .query("watched_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect(),
    ctx.db
      .query("movie_nights")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect(),
    ctx.db
      .query("watchlist_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect(),
  ]);

  return { users, watched, nights, watchlist };
}

export const getHallOfFame = query({
  args: {},
  handler: async (ctx) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return null;

    const { users, watched, nights, watchlist } = await loadOrgStatsBundle(
      ctx,
      orgCtx.orgId,
    );

    const userMap = new Map(users.map((u) => [u._id, u]));

    const ratingsByUser = new Map<Id<"users">, number[]>();
    for (const entry of watched) {
      for (const r of entry.ratings) {
        const list = ratingsByUser.get(r.userId) ?? [];
        list.push(r.score);
        ratingsByUser.set(r.userId, list);
      }
    }

    const criticRows = [...ratingsByUser.entries()]
      .map(([id, scores]) => ({
        user: userRef(userMap.get(id) ?? null),
        avgScore: avg(scores)!,
        count: scores.length,
      }))
      .filter((r) => r.user && r.count >= 1)
      .sort((a, b) => a.avgScore - b.avgScore);

    const harshest = criticRows[0] ?? null;
    const softie =
      criticRows.length > 0 ? criticRows[criticRows.length - 1]! : null;

    const hostCounts = new Map<Id<"users">, number>();
    for (const night of nights) {
      hostCounts.set(night.hostId, (hostCounts.get(night.hostId) ?? 0) + 1);
    }
    const topHostRow =
      [...hostCounts.entries()]
        .map(([id, count]) => ({
          user: userRef(userMap.get(id) ?? null),
          count,
        }))
        .filter((r) => r.user)
        .sort((a, b) => b.count - a.count)[0] ?? null;

    const upvoteCounts = new Map<Id<"users">, number>();
    for (const entry of watchlist) {
      for (const uid of entry.upvotes) {
        upvoteCounts.set(uid, (upvoteCounts.get(uid) ?? 0) + 1);
      }
    }
    const topUpvoterRow =
      [...upvoteCounts.entries()]
        .map(([id, count]) => ({
          user: userRef(userMap.get(id) ?? null),
          count,
        }))
        .filter((r) => r.user)
        .sort((a, b) => b.count - a.count)[0] ?? null;

    const suggestScores = new Map<Id<"users">, number[]>();
    for (const entry of watched) {
      if (!entry.ratings.length || !entry.suggestedBy?.length) continue;
      const groupAvg = avg(entry.ratings.map((r) => r.score));
      if (groupAvg == null) continue;
      for (const sid of entry.suggestedBy) {
        const list = suggestScores.get(sid) ?? [];
        list.push(groupAvg);
        suggestScores.set(sid, list);
      }
    }
    const suggestRows = [...suggestScores.entries()]
      .map(([id, scores]) => ({
        user: userRef(userMap.get(id) ?? null),
        avgGroupScore: avg(scores)!,
        count: scores.length,
      }))
      .filter((r) => r.user && r.count >= 1)
      .sort((a, b) => a.avgGroupScore - b.avgGroupScore);

    const worstSuggester = suggestRows[0] ?? null;
    const oracle =
      suggestRows.length > 0 ? suggestRows[suggestRows.length - 1]! : null;

    let controversy: {
      user: UserRef;
      spread: number;
      movieTitle: string;
    } | null = null;

    const movies = await Promise.all(
      watched.map(async (e) => ({
        entry: e,
        movie: await ctx.db.get(e.movieId),
      })),
    );

    for (const { entry, movie } of movies) {
      if (entry.ratings.length < 2) continue;
      const scores = entry.ratings.map((r) => r.score);
      const spread = Math.max(...scores) - Math.min(...scores);
      if (spread <= 0) continue;
      const mean = avg(scores)!;
      let farthest = entry.ratings[0]!;
      for (const r of entry.ratings) {
        if (Math.abs(r.score - mean) > Math.abs(farthest.score - mean)) {
          farthest = r;
        }
      }
      if (!controversy || spread > controversy.spread) {
        const u = userRef(userMap.get(farthest.userId) ?? null);
        if (u) {
          controversy = {
            user: u,
            spread,
            movieTitle: movie?.title ?? "Unknown",
          };
        }
      }
    }

    return {
      harshest: harshest
        ? {
            user: harshest.user!,
            avgScore: harshest.avgScore,
            count: harshest.count,
          }
        : null,
      softie: softie
        ? { user: softie.user!, avgScore: softie.avgScore, count: softie.count }
        : null,
      topHost: topHostRow
        ? { user: topHostRow.user!, count: topHostRow.count }
        : null,
      topUpvoter: topUpvoterRow
        ? { user: topUpvoterRow.user!, count: topUpvoterRow.count }
        : null,
      worstSuggester: worstSuggester
        ? {
            user: worstSuggester.user!,
            avgGroupScore: worstSuggester.avgGroupScore,
            count: worstSuggester.count,
          }
        : null,
      oracle: oracle
        ? {
            user: oracle.user!,
            avgGroupScore: oracle.avgGroupScore,
            count: oracle.count,
          }
        : null,
      controversy,
    };
  },
});

export const getCharts = query({
  args: {
    /** Client-passed epoch ms so the query stays deterministic */
    now: v.number(),
  },
  handler: async (ctx, { now }) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) {
      return { byMonth: [], byGenre: [], ratingHistogram: [] };
    }

    const watched = await ctx.db
      .query("watched_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();
    const withMovies = await Promise.all(
      watched.map(async (e) => ({
        entry: e,
        movie: await ctx.db.get(e.movieId),
      })),
    );

    const ref = new Date(now);
    const byMonthMap = new Map<string, number>();
    const monthLabels = new Map<string, string>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonthMap.set(key, 0);
      monthLabels.set(
        key,
        d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      );
    }
    for (const { entry } of withMovies) {
      const d = new Date(entry.watchedAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (byMonthMap.has(key)) {
        byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + 1);
      }
    }
    const byMonth = [...byMonthMap.entries()].map(([month, count]) => ({
      month,
      label: monthLabels.get(month) ?? month,
      count,
    }));

    const genreCounts = new Map<string, number>();
    for (const { movie } of withMovies) {
      if (!movie) continue;
      for (const g of movie.genres) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
      }
    }
    const byGenre = [...genreCounts.entries()]
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const buckets = Array.from({ length: 10 }, (_, i) => ({
      score: i + 1,
      count: 0,
    }));
    for (const { entry } of withMovies) {
      for (const r of entry.ratings) {
        const idx = Math.min(9, Math.max(0, Math.round(r.score) - 1));
        buckets[idx]!.count += 1;
      }
    }

    return { byMonth, byGenre, ratingHistogram: buckets };
  },
});

export const getSeasonWrap = query({
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return null;

    const start = Date.UTC(year, 0, 1);
    const end = Date.UTC(year + 1, 0, 1);

    const watched = await ctx.db
      .query("watched_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();
    const inYear = watched.filter(
      (e) => e.watchedAt >= start && e.watchedAt < end,
    );
    const nights = await ctx.db
      .query("movie_nights")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();
    const nightsInYear = nights.filter((n) => n.date >= start && n.date < end);

    const allRatings = inYear.flatMap((e) => e.ratings.map((r) => r.score));
    const withMovies = await Promise.all(
      inYear.map(async (e) => ({
        entry: e,
        movie: await ctx.db.get(e.movieId),
        groupAvg: avg(e.ratings.map((r) => r.score)),
      })),
    );

    let best: { title: string; score: number } | null = null;
    let worst: { title: string; score: number } | null = null;
    let mostControversial: { title: string; spread: number } | null = null;
    let longest: { title: string; runtime: number } | null = null;

    for (const { entry, movie, groupAvg } of withMovies) {
      if (!movie) continue;
      if (groupAvg != null) {
        if (!best || groupAvg > best.score) {
          best = { title: movie.title, score: groupAvg };
        }
        if (!worst || groupAvg < worst.score) {
          worst = { title: movie.title, score: groupAvg };
        }
      }
      if (entry.ratings.length >= 2) {
        const scores = entry.ratings.map((r) => r.score);
        const spread = Math.max(...scores) - Math.min(...scores);
        if (!mostControversial || spread > mostControversial.spread) {
          mostControversial = { title: movie.title, spread };
        }
      }
      if (movie.runtime != null) {
        if (!longest || movie.runtime > longest.runtime) {
          longest = { title: movie.title, runtime: movie.runtime };
        }
      }
    }

    return {
      year,
      moviesWatched: inYear.length,
      nightsHeld: nightsInYear.length,
      ratingsLogged: allRatings.length,
      avgRating: avg(allRatings),
      best,
      worst,
      mostControversial,
      longest,
    };
  },
});

export const getRoasts = query({
  args: {},
  handler: async (ctx) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return [];

    const { users, watched, watchlist, nights } = await loadOrgStatsBundle(
      ctx,
      orgCtx.orgId,
    );
    const userMap = new Map(users.map((u) => [u._id, u]));
    const roasts: string[] = [];

    const ratingsByUser = new Map<Id<"users">, number[]>();
    for (const entry of watched) {
      for (const r of entry.ratings) {
        const list = ratingsByUser.get(r.userId) ?? [];
        list.push(r.score);
        ratingsByUser.set(r.userId, list);
      }
    }

    const sortedCritics = [...ratingsByUser.entries()]
      .map(([id, scores]) => ({
        name: userMap.get(id)?.name ?? "Someone",
        avg: avg(scores)!,
        count: scores.length,
      }))
      .filter((r) => r.count >= 1)
      .sort((a, b) => a.avg - b.avg);

    if (sortedCritics[0] && sortedCritics[0].avg < 6) {
      roasts.push(
        `${sortedCritics[0].name} rates like the movie personally offended them (avg ${sortedCritics[0].avg.toFixed(1)}).`,
      );
    }
    if (sortedCritics.length > 0) {
      const soft = sortedCritics[sortedCritics.length - 1]!;
      if (soft.avg >= 7.5) {
        roasts.push(
          `${soft.name} would give a parking ticket a ${soft.avg.toFixed(1)}. Softie confirmed.`,
        );
      }
    }

    const lonely = watchlist.filter((e) => e.upvotes.length === 0);
    if (lonely.length >= 3) {
      roasts.push(
        `${lonely.length} watchlist picks are sitting there with zero upvotes. Courageous.`,
      );
    } else if (lonely.length === 1) {
      const adder = userMap.get(lonely[0]!.addedBy)?.name ?? "Someone";
      roasts.push(
        `${adder} added something nobody else has upvoted. Bold strategy.`,
      );
    }

    if (nights.filter((n) => n.status === "upcoming").length === 0) {
      roasts.push("No night scheduled. The couch misses you.");
    }

    if (watched.length === 0) {
      roasts.push("Zero movies logged. This Hall of Fame is mostly vibes.");
    }

    return roasts.slice(0, 6);
  },
});
