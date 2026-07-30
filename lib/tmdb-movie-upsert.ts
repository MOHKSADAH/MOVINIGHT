const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";

export type TmdbMovieDetail = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
};

export async function fetchTmdbMovieDetail(
  tmdbId: number,
  language: "en-US" | "ar",
): Promise<TmdbMovieDetail> {
  const res = await fetch(
    `/api/tmdb/movie/${tmdbId}?language=${encodeURIComponent(language)}`,
  );
  if (!res.ok) {
    throw new Error("Failed to load movie details");
  }
  return (await res.json()) as TmdbMovieDetail;
}

export function tmdbDetailToUpsertArgs(
  detail: TmdbMovieDetail,
  detailAr?: TmdbMovieDetail | null,
) {
  return {
    tmdbId: detail.id,
    title: detail.title,
    titleAr:
      detailAr?.title?.trim() && detailAr.title !== detail.title
        ? detailAr.title
        : undefined,
    poster: detail.poster_path
      ? `${TMDB_IMG}${detail.poster_path}`
      : "/placeholder.jpg",
    backdrop: detail.backdrop_path
      ? `${TMDB_BACKDROP}${detail.backdrop_path}`
      : undefined,
    overview: detail.overview,
    overviewAr:
      detailAr?.overview?.trim() && detailAr.overview !== detail.overview
        ? detailAr.overview
        : undefined,
    genres: detail.genres.map((g) => g.name),
    runtime: detail.runtime ?? undefined,
    releaseYear: detail.release_date
      ? new Date(detail.release_date).getFullYear()
      : 0,
    imdbRating: detail.vote_average,
    imdbVotes: detail.vote_count,
  };
}

export async function fetchTmdbMovieUpsertPayload(tmdbId: number) {
  const detail = await fetchTmdbMovieDetail(tmdbId, "en-US");
  let detailAr: TmdbMovieDetail | null = null;
  try {
    detailAr = await fetchTmdbMovieDetail(tmdbId, "ar");
  } catch {
    detailAr = null;
  }
  return tmdbDetailToUpsertArgs(detail, detailAr);
}
