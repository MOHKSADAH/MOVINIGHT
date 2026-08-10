"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { RouletteWheel } from "@/components/roulette-wheel";
import { TMDBSearch } from "@/components/tmdb-search";
import { MoviePosterCard } from "@/components/movie-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Plus,
  Film,
  Check,
  Star,
  Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { getDateFnsLocale, getLocalizedMovieOverview, getLocalizedMovieTitle } from "@/lib/locale";
import { motion, AnimatePresence } from "framer-motion";
import { StarRating } from "@/components/star-rating";
import Image from "next/image";

const STATUS_CONFIG = {
  upcoming: {
    labelKey: "statusUpcoming" as const,
    variant: "secondary" as const,
    color: "text-muted-foreground",
  },
  active: {
    labelKey: "statusNowPlaying" as const,
    variant: "default" as const,
    color: "text-primary",
  },
  done: {
    labelKey: "statusDone" as const,
    variant: "outline" as const,
    color: "text-muted-foreground",
  },
};

function WrapUpDialog({
  nightId,
  pickedMovieId,
  open,
  onClose,
}: {
  nightId: Id<"movie_nights">;
  pickedMovieId: Id<"movies"> | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("nights");
  const tWatched = useTranslations("watched");
  const tCommon = useTranslations("common");
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const updateStatus = useMutation(api.nights.updateNightStatus);
  const addWatched = useMutation(api.watched.addWatchedEntry);
  const addRating = useMutation(api.watched.addRating);

  const handleWrapUp = async () => {
    setSaving(true);
    try {
      await updateStatus({ nightId, status: "done" });

      if (pickedMovieId) {
        const entryId = await addWatched({
          movieId: pickedMovieId,
          nightId,
          watchedAt: Date.now(),
        });
        if (score > 0) {
          await addRating({ entryId, score, note: note || undefined });
        }
      }

      toast.success(t("toastWrappedUp"));
      onClose();
    } catch {
      toast.error(t("toastWrapUpFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("wrapUpDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">{t("wrapUpDescription")}</p>
          {pickedMovieId && (
            <>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t("yourRating")}</p>
                <StarRating value={score} onChange={setScore} size="md" max={5} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="wrap-up-note">
                  {tCommon("noteOptional")}
                </label>
                <input
                  id="wrap-up-note"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={tWatched("notePlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button className="flex-1" onClick={handleWrapUp} disabled={saving}>
              {saving ? t("wrappingUp") : t("wrapUpButton")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function NightRoomPage() {
  const routeParams = useParams<{ id: string }>();
  const nightId = routeParams.id as Id<"movie_nights">;

  const t = useTranslations("nights");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);

  const user = useQuery(api.users.getCurrentUser);
  const night = useQuery(api.nights.getNight, { nightId });
  const joinNight = useMutation(api.nights.joinNight);
  const pickMovie = useMutation(api.nights.pickMovie);
  const updateStatus = useMutation(api.nights.updateNightStatus);

  const handleJoin = async () => {
    try {
      await joinNight({ nightId });
      toast.success(t("toastJoined"));
    } catch {
      toast.error(t("toastJoinFailed"));
    }
  };

  const handlePickMovie = async (movieId: string) => {
    try {
      await pickMovie({ nightId, movieId: movieId as Id<"movies"> });
      toast.success(t("toastPicked"));
    } catch {
      toast.error(t("toastPickFailed"));
    }
  };

  const handleStartNight = async () => {
    try {
      await updateStatus({ nightId, status: "active" });
    } catch {
      toast.error(t("toastStartFailed"));
    }
  };

  if (night === undefined) {
    return (
      <AppShell>
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (night === null) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">
          <Film className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>{t("notFound")}</p>
        </div>
      </AppShell>
    );
  }

  const isAttending = user ? night.attendees.includes(user._id) : false;
  const isHost = user ? night.hostId === user._id : false;
  const statusConfig = STATUS_CONFIG[night.status];
  const candidates = night.candidateMovies.filter(Boolean) as NonNullable<
    typeof night.candidateMovies[number]
  >[];

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {night.title}
              </h1>
              <Badge variant={statusConfig.variant}>{t(statusConfig.labelKey)}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {format(new Date(night.date), "EEEE, MMMM d", {
                  locale: dateFnsLocale,
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!isAttending && (
              <Button variant="outline" size="sm" onClick={handleJoin}>
                {t("joinNight")}
              </Button>
            )}
            {isHost && night.status === "upcoming" && (
              <Button size="sm" onClick={handleStartNight}>
                {t("startNight")}
              </Button>
            )}
            {isHost && night.status === "active" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setWrapUpOpen(true)}
              >
                <Check className="h-3.5 w-3.5 me-1.5" />
                {t("wrapUp")}
              </Button>
            )}
          </div>
        </div>

        {/* Attendees */}
        <div>
          <p className="text-sm font-medium mb-2">
            {t("attending", { count: night.attendees.length })}
          </p>
          <div className="flex -space-x-2">
            {night.attendeeUsers.map((u) =>
              u ? (
                <Avatar
                  key={u._id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage src={u.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {u.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
              ) : null,
            )}
          </div>
        </div>

        <Tabs defaultValue="candidates" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="candidates" className="flex-1">
              {t("tabCandidates", { count: candidates.length })}
            </TabsTrigger>
            <TabsTrigger value="roulette" className="flex-1">
              <Shuffle className="h-3.5 w-3.5 me-1.5" />
              {t("tabRoulette")}
            </TabsTrigger>
            {night.pickedMovieData && (
              <TabsTrigger value="picked" className="flex-1">
                <Star className="h-3.5 w-3.5 me-1.5" />
                {t("tabPicked")}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Candidates tab */}
          <TabsContent value="candidates" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {candidates.length === 0
                  ? t("noCandidatesYet")
                  : candidates.length === 1
                    ? t("candidatesRunning", { count: candidates.length })
                    : t("candidatesRunningPlural", { count: candidates.length })}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setAddCandidateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("addButton")}
              </Button>
            </div>

            {candidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Film className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t("addMoviesTonight")}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => setAddCandidateOpen(true)}
                >
                  {t("addFirstCandidate")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {candidates.map((movie) => (
                  <MoviePosterCard
                    key={movie._id}
                    movie={movie}
                    selected={night.pickedMovie === movie._id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Roulette tab */}
          <TabsContent value="roulette" className="pt-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="font-semibold">{t("rouletteTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {candidates.length < 2
                  ? t("rouletteNeedTwo")
                  : t("rouletteOdds")}
              </p>
            </div>
            <div className="flex justify-center">
              <RouletteWheel
                movies={candidates.map((m) => ({
                  _id: m._id,
                  title: m.title,
                  titleAr: m.titleAr,
                  poster: m.poster,
                }))}
                onPickMovie={handlePickMovie}
                disabled={night.status === "done"}
              />
            </div>
          </TabsContent>

          {/* Picked movie tab */}
          {night.pickedMovieData && (
            <TabsContent value="picked" className="pt-6">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-6 text-center"
                >
                  <div>
                    <Badge className="mb-3">{t("tonightsPick")}</Badge>
                    <div className="relative w-40 h-60 mx-auto rounded-xl overflow-hidden shadow-2xl">
                      {night.pickedMovieData.poster &&
                        night.pickedMovieData.poster !== "/placeholder.jpg" && (
                          <Image
                            src={night.pickedMovieData.poster}
                            alt={getLocalizedMovieTitle(
                              night.pickedMovieData,
                              locale,
                            )}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {getLocalizedMovieTitle(night.pickedMovieData, locale)}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {night.pickedMovieData.releaseYear}
                      {night.pickedMovieData.runtime
                        ? ` · ${night.pickedMovieData.runtime}m`
                        : ""}
                    </p>
                    {night.pickedMovieData.genres.length > 0 && (
                      <div className="flex gap-1.5 justify-center mt-2 flex-wrap">
                        {night.pickedMovieData.genres.slice(0, 3).map((g) => (
                          <Badge key={g} variant="secondary">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                    {(() => {
                      const overview = getLocalizedMovieOverview(
                        night.pickedMovieData!,
                        locale,
                      );
                      return overview ? (
                    <p className="text-sm text-muted-foreground max-w-md line-clamp-3">
                      {overview}
                    </p>
                      ) : null;
                    })()}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <TMDBSearch
        open={addCandidateOpen}
        onClose={() => setAddCandidateOpen(false)}
        mode="candidate"
        nightId={nightId}
      />

      <WrapUpDialog
        nightId={nightId}
        pickedMovieId={night.pickedMovie}
        open={wrapUpOpen}
        onClose={() => setWrapUpOpen(false)}
      />
    </AppShell>
  );
}
