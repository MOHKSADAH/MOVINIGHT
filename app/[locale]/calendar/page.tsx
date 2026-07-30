"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Film, ChevronRight, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { getDateFnsLocale, getLocalizedMovieTitle } from "@/lib/locale";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";
import { buildNightsIcs, downloadIcs } from "@/lib/ics";

type CalendarNight = {
  _id: string;
  title: string;
  date: number;
  status: "upcoming" | "active" | "done";
  attendees: string[];
  candidates: string[];
  pickedMovieData: {
    title: string;
    titleAr?: string;
    poster: string;
    imdbRating?: number;
  } | null;
  firstCandidateData: {
    title: string;
    titleAr?: string;
    poster: string;
  } | null;
  avgRating: number | null;
  candidatePosters?: { title: string; titleAr?: string; poster: string }[];
};

// Context to share nightDates map with the custom DayButton (avoids component-in-render)
const NightDatesCtx = createContext<Record<string, CalendarNight[]>>({});

function CalendarDayButton({ day, modifiers, ...props }: DayButtonProps) {
  const locale = useLocale();
  const nightDates = useContext(NightDatesCtx);
  const night = nightDates[day.date.toDateString()]?.[0];

  const base = "h-14 w-14 p-0 rounded-md transition-colors";

  // Night with a picked/final movie — full poster
  if (night?.pickedMovieData) {
    return (
      <button
        {...props}
        className={cn(base, "relative overflow-hidden border border-primary/40")}
      >
        <Image
          src={night.pickedMovieData.poster}
          alt={getLocalizedMovieTitle(night.pickedMovieData, locale)}
          fill
          className="object-cover opacity-60"
          sizes="56px"
        />
        <span className="absolute top-0.5 start-1 text-[10px] font-bold text-white drop-shadow z-10">
          {day.date.getDate()}
        </span>
        {night.avgRating != null && (
          <span className="absolute bottom-0.5 end-0.5 text-[8px] font-semibold bg-black/60 text-white px-0.5 rounded z-10 leading-tight">
            {night.avgRating.toFixed(1)}
          </span>
        )}
      </button>
    );
  }

  // Night with candidate movies (but no final pick) — dimmed poster + indicator
  if (night?.firstCandidateData) {
    return (
      <button
        {...props}
        className={cn(base, "relative overflow-hidden border border-border")}
      >
        <Image
          src={night.firstCandidateData.poster}
          alt={getLocalizedMovieTitle(night.firstCandidateData, locale)}
          fill
          className="object-cover opacity-25"
          sizes="56px"
        />
        <span className="absolute top-0.5 start-1 text-[10px] font-bold text-white drop-shadow z-10">
          {day.date.getDate()}
        </span>
        <span className="absolute bottom-1 end-1 w-1.5 h-1.5 rounded-full bg-primary z-10" />
      </button>
    );
  }

  // Night with no movies yet — dot indicator only
  if (night) {
    return (
      <button
        {...props}
        className={cn(
          base,
          "relative flex flex-col items-center justify-center hover:bg-accent",
          modifiers.today && "bg-accent font-semibold",
          modifiers.outside && "opacity-40",
        )}
      >
        <span className="text-sm">{day.date.getDate()}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
      </button>
    );
  }

  return (
    <button
      {...props}
      className={cn(
        base,
        "flex items-center justify-center hover:bg-accent",
        modifiers.today && "bg-accent font-semibold",
        modifiers.selected &&
          "bg-primary text-primary-foreground hover:bg-primary",
        modifiers.outside && "opacity-40",
        modifiers.disabled && "opacity-30 cursor-not-allowed",
      )}
    />
  );
}

function CreateNightDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const createNight = useMutation(api.nights.createNight);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !date) {
      toast.error(t("toastTitleDateRequired"));
      return;
    }
    setSaving(true);
    try {
      await createNight({ title: title.trim(), date: date.getTime() });
      toast.success(t("toastNightCreated"));
      setTitle("");
      setDate(undefined);
      onClose();
    } catch {
      toast.error(t("toastCreateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("createDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="night-title">
              {t("titleLabel")}
            </label>
            <Input
              id="night-title"
              placeholder={t("titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("dateLabel")}</p>
            <div className="flex justify-center border border-border rounded-md py-2">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={today ? { before: today } : undefined}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={saving || !title || !date}
            >
              {saving ? tCommon("creating") : t("createNight")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_CONFIG = {
  upcoming: { labelKey: "statusUpcoming" as const, variant: "secondary" as const },
  active: { labelKey: "statusTonight" as const, variant: "default" as const },
  done: { labelKey: "statusDone" as const, variant: "outline" as const },
};

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const nights = useQuery(api.nights.getCalendarNights);

  const nightDates =
    nights?.reduce(
      (acc, night) => {
        const key = new Date(night.date).toDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(night as CalendarNight);
        return acc;
      },
      {} as Record<string, CalendarNight[]>,
    ) ?? {};

  const upcomingNights = nights?.filter((n) => n.status !== "done");
  const pastNights = nights?.filter((n) => n.status === "done");

  const handleDownloadIcs = () => {
    if (!nights || nights.length === 0) {
      toast.error(t("toastNoExport"));
      return;
    }
    const ics = buildNightsIcs(
      nights.map((n) => ({
        _id: n._id,
        title: n.title,
        date: n.date,
        status: n.status,
      })),
      window.location.origin,
    );
    downloadIcs("movie-nights.ics", ics);
    toast.success(t("toastCalendarDownloaded"));
  };

  return (
    <AppShell>
      <NightDatesCtx.Provider value={nightDates}>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleDownloadIcs}
                disabled={!nights || nights.length === 0}
              >
                <Download className="h-4 w-4" />
                {t("addToCalendar")}
              </Button>
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("newNight")}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-[auto_1fr] gap-6">
            {/* Calendar */}
            <Card className="self-start calendar-main">
              <CardContent className="p-4">
                <DayPicker
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  components={{ DayButton: CalendarDayButton }}
                  classNames={{
                    weekday:
                      "text-center text-xs text-muted-foreground font-normal pb-1",
                  }}
                />
              </CardContent>
            </Card>

            {/* Nights list */}
            <div className="space-y-6">
              {/* Upcoming */}
              <div>
                <h2 className="font-semibold mb-3">{t("upcomingNights")}</h2>
                <div className="flex flex-col gap-3">
                  {nights === undefined ? (
                    [...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))
                  ) : upcomingNights && upcomingNights.length > 0 ? (
                    upcomingNights
                      .sort((a, b) => a.date - b.date)
                      .map((night) => {
                        const config = STATUS_CONFIG[night.status];
                        return (
                          <Link key={night._id} href={`/night/${night._id}`} className="block">
                            <Card className="border border-border shadow-sm hover:bg-accent/30 transition-colors cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-muted">
                                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {night.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {format(new Date(night.date), "EEEE, MMMM d", {
                                          locale: dateFnsLocale,
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={config.variant}>
                                      {t(config.labelKey)}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2 ps-11">
                                  <span className="text-xs text-muted-foreground">
                                    {tCommon("attending", {
                                      count: night.attendees.length,
                                    })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground">
                                    {tCommon("candidates", {
                                      count: night.candidates.length,
                                    })}
                                  </span>
                                </div>
                                {night.candidatePosters && night.candidatePosters.length > 0 && (
                                  <div className="flex gap-1.5 mt-2 ps-11">
                                    {night.candidatePosters.map((c) => (
                                      <div
                                        key={`${c.poster}:${c.title}`}
                                        className="relative w-8 h-12 rounded overflow-hidden bg-muted shrink-0"
                                      >
                                        <Image
                                          src={c.poster}
                                          alt={getLocalizedMovieTitle(c, locale)}
                                          fill
                                          className="object-cover"
                                          sizes="32px"
                                        />
                                      </div>
                                    ))}
                                    {night.candidates.length > 3 && (
                                      <div className="relative w-8 h-12 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                          +{night.candidates.length - 3}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Film className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">{t("noUpcoming")}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-xs"
                        onClick={() => setCreateOpen(true)}
                      >
                        {t("scheduleOneNow")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Past */}
              {pastNights && pastNights.length > 0 && (
                <div>
                  <h2 className="font-semibold mb-3 text-muted-foreground">
                    {t("pastNights")}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {pastNights
                      .sort((a, b) => b.date - a.date)
                      .slice(0, 5)
                      .map((night) => (
                        <Link
                          key={night._id}
                          href={`/night/${night._id}`}
                          className="block"
                        >
                          <Card className="border border-border bg-card shadow-sm hover:bg-accent/30 transition-colors cursor-pointer">
                            <CardContent className="p-3.5 flex items-center gap-3">
                              {/* Movie poster thumbnail */}
                              <div className="relative shrink-0 w-10 h-14 rounded overflow-hidden bg-muted ring-1 ring-border">
                                {night.pickedMovieData ? (
                                  <Image
                                    src={night.pickedMovieData.poster}
                                    alt={getLocalizedMovieTitle(
                                      night.pickedMovieData,
                                      locale,
                                    )}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Film className="h-4 w-4 text-muted-foreground opacity-40" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {night.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {format(new Date(night.date), "MMM d, yyyy", {
                                    locale: dateFnsLocale,
                                  })}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {night.pickedMovieData?.imdbRating && (
                                    <div className="flex items-center gap-1 bg-yellow-500/10 rounded px-1.5 py-0.5">
                                      <span className="text-[10px] font-bold text-yellow-600">
                                        {tCommon("imdb")}
                                      </span>
                                      <span className="text-xs font-semibold">
                                        {night.pickedMovieData.imdbRating.toFixed(
                                          1,
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {night.avgRating != null && (
                                    <span className="text-xs text-muted-foreground">
                                      {tCommon("groupRating")}{" "}
                                      <span className="font-medium text-foreground">
                                        {night.avgRating.toFixed(1)}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <Badge variant="outline" className="text-xs shrink-0">
                                {t("statusDone")}
                              </Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <CreateNightDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </NightDatesCtx.Provider>
    </AppShell>
  );
}
