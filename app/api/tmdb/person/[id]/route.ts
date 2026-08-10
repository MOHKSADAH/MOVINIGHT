import { NextRequest, NextResponse } from "next/server";
import { guardTmdbApi } from "@/lib/tmdb-api-guard";
import { isTmdbNumericId } from "@/lib/tmdb-rate-limit";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = await guardTmdbApi(request);
  if (blocked) return blocked;

  const { id } = await params;
  if (!isTmdbNumericId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const languageParam = searchParams.get("language");
  const language =
    languageParam === "ar" || languageParam === "en-US"
      ? languageParam
      : "en-US";

  const res = await fetch(
    `${TMDB_BASE}/person/${id}?language=${language}&append_to_response=movie_credits`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
