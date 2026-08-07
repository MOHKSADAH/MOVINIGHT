const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w342";

export type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
};

export type TmdbCrewMember = {
  id: number;
  name: string;
  job: string;
  department?: string;
  profile_path?: string | null;
};

export type TmdbVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
};

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
  credits?: {
    cast?: TmdbCastMember[];
    crew?: TmdbCrewMember[];
  };
  videos?: {
    results?: TmdbVideo[];
  };
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

export type CreditPerson = {
  id: number;
  name: string;
  character?: string;
  imageUrl?: string;
};

export function getTmdbDirector(
  detail: TmdbMovieDetail,
): CreditPerson | undefined {
  const director = detail.credits?.crew?.find((c) => c.job === "Director");
  if (!director) return undefined;
  const fromCast = detail.credits?.cast?.find((c) => c.id === director.id);
  const profilePath = director.profile_path ?? fromCast?.profile_path ?? null;
  return {
    id: director.id,
    name: director.name,
    imageUrl: profilePath ? `${TMDB_PROFILE}${profilePath}` : undefined,
  };
}

export function getTmdbTopCast(
  detail: TmdbMovieDetail,
  limit = 40,
): CreditPerson[] {
  const cast = [...(detail.credits?.cast ?? [])].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999),
  );
  return cast.slice(0, limit).map((member) => ({
    id: member.id,
    name: member.name,
    character: member.character,
    imageUrl: member.profile_path
      ? `${TMDB_PROFILE}${member.profile_path}`
      : undefined,
  }));
}

export type TmdbPersonMovieCredit = {
  id: number;
  title: string;
  character?: string;
  job?: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  popularity?: number;
};

export type TmdbPersonDetail = {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  profile_path: string | null;
  known_for_department?: string;
  movie_credits?: {
    cast?: TmdbPersonMovieCredit[];
    crew?: TmdbPersonMovieCredit[];
  };
};

export async function fetchTmdbPersonDetail(
  personId: number,
  language: "en-US" | "ar",
): Promise<TmdbPersonDetail> {
  const res = await fetch(
    `/api/tmdb/person/${personId}?language=${encodeURIComponent(language)}`,
  );
  if (!res.ok) {
    throw new Error("Failed to load person details");
  }
  return (await res.json()) as TmdbPersonDetail;
}

export function personProfileUrl(path: string | null | undefined): string | undefined {
  return path ? `${TMDB_PROFILE}${path}` : undefined;
}

export function personPosterUrl(path: string | null | undefined): string {
  return path ? `${TMDB_IMG}${path}` : "/placeholder.jpg";
}

/** Merge cast + crew credits, de-dupe by movie id, sort by year desc then popularity. */
export function getPersonFilmography(
  person: TmdbPersonDetail,
  limit = 40,
): {
  id: number;
  title: string;
  role: string;
  year: number | null;
  poster: string;
  rating?: number;
}[] {
  const byId = new Map<
    number,
    {
      id: number;
      title: string;
      role: string;
      year: number | null;
      poster: string;
      rating?: number;
      popularity: number;
    }
  >();

  for (const credit of person.movie_credits?.cast ?? []) {
    if (!credit.title?.trim()) continue;
    const year = credit.release_date
      ? new Date(credit.release_date).getFullYear()
      : null;
    byId.set(credit.id, {
      id: credit.id,
      title: credit.title,
      role: credit.character?.trim() || "Actor",
      year: year && !Number.isNaN(year) ? year : null,
      poster: personPosterUrl(credit.poster_path),
      rating: credit.vote_average,
      popularity: credit.popularity ?? 0,
    });
  }

  for (const credit of person.movie_credits?.crew ?? []) {
    if (!credit.title?.trim()) continue;
    const year = credit.release_date
      ? new Date(credit.release_date).getFullYear()
      : null;
    const existing = byId.get(credit.id);
    const job = credit.job?.trim() || "Crew";
    if (existing) {
      if (job === "Director" || !existing.role.includes(job)) {
        existing.role =
          job === "Director"
            ? `Director${existing.role !== "Actor" ? ` · ${existing.role}` : ""}`
            : `${existing.role} · ${job}`;
      }
      continue;
    }
    byId.set(credit.id, {
      id: credit.id,
      title: credit.title,
      role: job,
      year: year && !Number.isNaN(year) ? year : null,
      poster: personPosterUrl(credit.poster_path),
      rating: credit.vote_average,
      popularity: credit.popularity ?? 0,
    });
  }

  return [...byId.values()]
    .sort((a, b) => {
      const ay = a.year ?? 0;
      const by = b.year ?? 0;
      if (by !== ay) return by - ay;
      return b.popularity - a.popularity;
    })
    .slice(0, limit)
    .map(({ id, title, role, year, poster, rating }) => ({
      id,
      title,
      role,
      year,
      poster,
      rating,
    }));
}

/** Prefer an official YouTube trailer; fall back to any YouTube Trailer/Teaser. */
export function getTmdbTrailerUrl(detail: TmdbMovieDetail): string | undefined {
  const videos = detail.videos?.results ?? [];
  const youtube = videos.filter((v) => v.site === "YouTube");
  const trailer =
    youtube.find((v) => v.type === "Trailer" && v.official) ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser");
  return trailer
    ? `https://www.youtube.com/watch?v=${trailer.key}`
    : undefined;
}
