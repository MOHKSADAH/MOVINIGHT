/** TMDB movie genre ids for browse suggestions. */
export const TMDB_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
] as const;

export type TmdbGenre = (typeof TMDB_GENRES)[number];

const GENRE_BY_ID = new Map<number, string>(
  TMDB_GENRES.map((genre) => [genre.id, genre.name]),
);

/** Resolve TMDB search/discover `genre_ids` to display names (unknown ids dropped). */
export function genreNamesFromIds(ids: number[], limit = 3): string[] {
  const names: string[] = [];
  for (const id of ids) {
    const name = GENRE_BY_ID.get(id);
    if (!name) continue;
    names.push(name);
    if (names.length >= limit) break;
  }
  return names;
}
