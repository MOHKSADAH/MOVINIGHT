import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

/** Well-known, released films — not obscure high-rated or unreleased titles. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genreId = searchParams.get("genreId");
  const shuffle = searchParams.get("shuffle") === "1";
  const pageParam = searchParams.get("page");
  const languageParam = searchParams.get("language");
  const language =
    languageParam === "ar" || languageParam === "en-US"
      ? languageParam
      : "en-US";

  if (!genreId || !/^\d+$/.test(genreId)) {
    return NextResponse.json({ results: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const page =
    shuffle
      ? String(1 + Math.floor(Math.random() * 5))
      : pageParam && /^\d+$/.test(pageParam) && Number(pageParam) >= 1
        ? pageParam
        : "1";

  const params = new URLSearchParams({
    language,
    page,
    include_adult: "false",
    with_genres: genreId,
    sort_by: "popularity.desc",
    "vote_count.gte": "800",
    "vote_average.gte": "7",
    "primary_release_date.lte": today,
  });

  const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    ...(shuffle
      ? { cache: "no-store" as const }
      : { next: { revalidate: 3600 } }),
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: res.status });
  }

  const data = (await res.json()) as {
    results?: Array<{
      poster_path: string | null;
      overview: string;
      release_date?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };

  let results = (data.results ?? []).filter(
    (m) =>
      !!m.poster_path &&
      !!m.overview?.trim() &&
      !!m.release_date &&
      m.release_date <= today,
  );

  if (shuffle) {
    results = shuffleArray(results);
  }

  return NextResponse.json({ ...data, page: Number(page), results });
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}
