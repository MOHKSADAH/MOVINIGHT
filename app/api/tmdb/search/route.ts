import { NextRequest, NextResponse } from "next/server";
import { guardTmdbApi } from "@/lib/tmdb-api-guard";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  const blocked = await guardTmdbApi(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const languageParam = searchParams.get("language");
  const language =
    languageParam === "ar" || languageParam === "en-US"
      ? languageParam
      : "en-US";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (query.length > 200) {
    return NextResponse.json(
      { error: "Query too long" },
      { status: 400 },
    );
  }

  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=${language}&page=1&include_adult=false`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
