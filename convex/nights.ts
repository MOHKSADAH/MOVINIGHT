import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getNights = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("movie_nights").order("desc").collect();
  },
});

export const getUpcomingNights = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("movie_nights")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();
  },
});

export const getNight = query({
  args: { nightId: v.id("movie_nights") },
  handler: async (ctx, { nightId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const night = await ctx.db.get(nightId);
    if (!night) return null;

    const candidateMovies = await Promise.all(
      night.candidates.map((id) => ctx.db.get(id)),
    );
    const pickedMovieData = night.pickedMovie
      ? await ctx.db.get(night.pickedMovie)
      : null;
    const host = await ctx.db.get(night.hostId);
    const attendeeUsers = await Promise.all(
      night.attendees.map((id) => ctx.db.get(id)),
    );

    return {
      ...night,
      candidateMovies: candidateMovies.filter(Boolean),
      pickedMovieData,
      host,
      attendeeUsers: attendeeUsers.filter(Boolean),
    };
  },
});

export const createNight = mutation({
  args: {
    title: v.string(),
    date: v.number(),
  },
  handler: async (ctx, { title, date }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const nightId = await ctx.db.insert("movie_nights", {
      title,
      date,
      hostId: userId,
      status: "upcoming",
      attendees: [userId],
      candidates: [],
    });

    await ctx.scheduler.runAfter(0, internal.nightsReminders.scheduleReminder, {
      nightId,
    });

    return nightId;
  },
});

export const addCandidate = mutation({
  args: {
    nightId: v.id("movie_nights"),
    movieId: v.id("movies"),
  },
  handler: async (ctx, { nightId, movieId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const night = await ctx.db.get(nightId);
    if (!night) throw new Error("Night not found");

    if (!night.candidates.includes(movieId)) {
      await ctx.db.patch(nightId, {
        candidates: [...night.candidates, movieId],
      });
    }
  },
});

export const pickMovie = mutation({
  args: {
    nightId: v.id("movie_nights"),
    movieId: v.id("movies"),
  },
  handler: async (ctx, { nightId, movieId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(nightId, {
      pickedMovie: movieId,
      status: "active",
    });
  },
});

export const updateNightStatus = mutation({
  args: {
    nightId: v.id("movie_nights"),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("done"),
    ),
  },
  handler: async (ctx, { nightId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const night = await ctx.db.get(nightId);
    if (!night) throw new Error("Night not found");

    if (status === "done" && night.reminderJobId) {
      try {
        await ctx.scheduler.cancel(night.reminderJobId);
      } catch {
        // Job may already have run
      }
      await ctx.db.patch(nightId, { status, reminderJobId: undefined });
      return;
    }

    await ctx.db.patch(nightId, { status });
  },
});

export const joinNight = mutation({
  args: { nightId: v.id("movie_nights") },
  handler: async (ctx, { nightId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const night = await ctx.db.get(nightId);
    if (!night) throw new Error("Night not found");

    if (!night.attendees.includes(userId)) {
      await ctx.db.patch(nightId, {
        attendees: [...night.attendees, userId],
      });
    }
  },
});

export const getCalendarNights = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const nights = await ctx.db.query("movie_nights").order("desc").collect();

    return await Promise.all(
      nights.map(async (night) => {
        let pickedMovieData: {
          title: string;
          titleAr?: string;
          poster: string;
          imdbRating?: number;
        } | null = null;
        let firstCandidateData: {
          title: string;
          titleAr?: string;
          poster: string;
        } | null = null;
        let avgRating: number | null = null;

        if (night.pickedMovie) {
          const movie = await ctx.db.get(night.pickedMovie);
          if (movie) {
            pickedMovieData = {
              title: movie.title,
              titleAr: movie.titleAr,
              poster: movie.poster,
              imdbRating: movie.imdbRating,
            };
          }

          const watchedEntry = await ctx.db
            .query("watched_entries")
            .withIndex("by_night", (q) => q.eq("nightId", night._id))
            .first();

          if (watchedEntry && watchedEntry.ratings.length > 0) {
            const total = watchedEntry.ratings.reduce(
              (sum, r) => sum + r.score,
              0,
            );
            avgRating = total / watchedEntry.ratings.length;
          }
        } else if (night.candidates.length > 0) {
          const firstCandidate = await ctx.db.get(night.candidates[0]);
          if (firstCandidate) {
            firstCandidateData = {
              title: firstCandidate.title,
              titleAr: firstCandidate.titleAr,
              poster: firstCandidate.poster,
            };
          }
        }

        const candidateMovies = await Promise.all(
          night.candidates.slice(0, 3).map((id) => ctx.db.get(id)),
        );
        const candidatePosters = candidateMovies
          .filter((m): m is NonNullable<typeof m> => m !== null)
          .map((m) => ({
            title: m.title,
            titleAr: m.titleAr,
            poster: m.poster,
          }));

        return {
          ...night,
          pickedMovieData,
          firstCandidateData,
          avgRating,
          candidatePosters,
        };
      }),
    );
  },
});
