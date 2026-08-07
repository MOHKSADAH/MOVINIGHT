"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, List, Eye, Pencil, Crown, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "@/i18n/navigation";
import { AvatarPicker } from "@/components/avatar-picker";
import { getDateFnsLocale, getLocalizedMovieTitle } from "@/lib/locale";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = id as Id<"users">;

  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);
  const router = useRouter();
  const { signOut } = useAuthActions();

  const currentUser = useQuery(api.users.getCurrentUser);
  const profileUser = useQuery(api.users.getUserById, { userId });
  const stats = useQuery(api.watched.getUserStats, { userId });
  const watchedEntries = useQuery(api.watched.getWatchedEntries);
  const watchlist = useQuery(api.watchlist.getWatchlist);
  const updateUser = useMutation(api.users.updateUser);
  const deleteAccount = useMutation(api.users.deleteAccount);

  const isOwnProfile = currentUser?._id === userId;
  const viewerIsAppOwner = currentUser?.isOwner === true;
  const profileIsAppOwner = profileUser?.isOwner === true;
  // The owner account is never deletable, so the crew can't lose its admin.
  const canDeleteProfile =
    !profileIsAppOwner && (isOwnProfile || viewerIsAppOwner);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleOpenEdit = () => {
    setEditName(profileUser?.name ?? "");
    setEditBio((profileUser as { bio?: string } | null | undefined)?.bio ?? "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        name: editName.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      toast.success(t("toastProfileUpdated"));
      setEditOpen(false);
    } catch {
      toast.error(t("toastProfileFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(isOwnProfile ? {} : { userId });
      toast.success(t("toastAccountDeleted"));
      setDeleteOpen(false);
      if (isOwnProfile) {
        await signOut();
        router.replace("/login");
      } else {
        router.replace("/");
      }
    } catch {
      toast.error(t("toastDeleteAccountFailed"));
      setDeleting(false);
    }
  };

  // Filter entries relevant to this user
  const userRatings = watchedEntries
    ?.map((entry) => ({
      ...entry,
      myRating: entry.ratings.find((r) => r.userId === userId),
    }))
    .filter((entry) => entry.myRating);

  const userWatchlistEntries = watchlist?.filter(
    (entry) => entry.addedBy?._id === userId,
  );

  if (profileUser === undefined) {
    return (
      <AppShell>
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (profileUser === null) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">
          <p>{t("profileNotFound")}</p>
        </div>
      </AppShell>
    );
  }

  const avatarSrc =
    profileUser.avatar ??
    (profileUser as { image?: string }).image ??
    undefined;

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback className="text-xl">
              {profileUser.name?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profileUser.name}</h1>
              {(profileUser as { isOwner?: boolean }).isOwner && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Crown className="h-3 w-3" />
                  {tCommon("owner")}
                </span>
              )}
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleOpenEdit}
                >
                  <Pencil className="h-3 w-3" />
                  {t("editProfile")}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profileUser.email}</p>
            {(profileUser as { bio?: string }).bio && (
              <p className="text-sm text-muted-foreground mt-1">
                {(profileUser as { bio?: string }).bio}
              </p>
            )}
            {profileUser.createdAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("profileMemberSince", {
                  date: format(new Date(profileUser.createdAt), "MMMM yyyy", {
                    locale: dateFnsLocale,
                  }),
                })}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              {stats == null ? (
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold">{stats.moviesWatched}</p>
              )}
              <div className="flex items-center justify-center gap-1 mt-1">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{t("statWatched")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {stats == null ? (
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold">{stats.ratingsGiven}</p>
              )}
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{t("statRatings")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {stats == null ? (
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
                </p>
              )}
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <p className="text-xs text-muted-foreground">{t("statAvgRatingShort")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Ratings | Added to watchlist */}
        <Tabs defaultValue="ratings" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="ratings" className="flex-1">
              {t("tabRatings", { count: userRatings?.length ?? 0 })}
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex-1">
              {t("tabAdded", { count: userWatchlistEntries?.length ?? 0 })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ratings" className="space-y-2 pt-4">
            {userRatings === undefined ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : userRatings.length > 0 ? (
              userRatings
                .sort((a, b) => (b.myRating?.score ?? 0) - (a.myRating?.score ?? 0))
                .map((entry) =>
                  entry.movie ? (
                    <div
                      key={entry._id}
                      className="flex gap-3 p-3 rounded-lg border border-border bg-card"
                    >
                      {(() => {
                        const title = getLocalizedMovieTitle(entry.movie, locale);
                        return (
                          <>
                      <div className="relative w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
                        {entry.movie.poster &&
                          entry.movie.poster !== "/placeholder.jpg" && (
                            <Image
                              src={entry.movie.poster}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.movie.releaseYear}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-semibold">
                              {entry.myRating?.score}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /10
                            </span>
                          </div>
                          {entry.myRating?.note && (
                            <span className="text-xs text-muted-foreground italic truncate">
                              &ldquo;{entry.myRating.note}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : null,
                )
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t("noRatingsYet")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-2 pt-4">
            {userWatchlistEntries === undefined ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : userWatchlistEntries.length > 0 ? (
              userWatchlistEntries.map((entry) =>
                entry.movie ? (
                  <div
                    key={entry._id}
                    className="flex gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    {(() => {
                      const title = getLocalizedMovieTitle(entry.movie, locale);
                      return (
                        <>
                    <div className="relative w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
                      {entry.movie.poster &&
                        entry.movie.poster !== "/placeholder.jpg" && (
                          <Image
                            src={entry.movie.poster}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{title}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.movie.releaseYear}
                      </p>
                      {entry.movie.genres.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {entry.movie.genres.slice(0, 2).map((g) => (
                            <Badge
                              key={g}
                              variant="secondary"
                              className="text-[10px] h-4 px-1.5"
                            >
                              {g}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null,
              )
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <List className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  {isOwnProfile ? t("nothingAddedOwn") : t("nothingAddedOther")}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {canDeleteProfile && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-destructive">
                {t("deleteAccountTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isOwnProfile
                  ? t("deleteOwnAccountDescription")
                  : t("deleteMemberDescription", {
                      name: profileUser.name ?? tCommon("unknown"),
                    })}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isOwnProfile
                  ? t("deleteOwnAccountAction")
                  : t("deleteMemberAction")}
              </Button>
            </section>
          </>
        )}
      </div>

      {/* Edit Profile Sheet */}
      <Sheet open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md gap-0 overflow-y-auto p-0"
        >
          <SheetHeader className="gap-1.5 space-y-0 border-b border-border p-6 pe-14 text-start">
            <SheetTitle>{t("editSheetTitle")}</SheetTitle>
            <SheetDescription>{t("editSheetDescription")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-6 py-6">
            <AvatarPicker
              currentAvatar={avatarSrc}
              fallbackInitial={editName?.[0]?.toUpperCase()}
            />

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="edit-name">{t("displayNameLabel")}</Label>
              <Input
                id="edit-name"
                placeholder={t("displayNamePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-bio">{t("bioLabel")}</Label>
              <Textarea
                id="edit-bio"
                placeholder={t("bioPlaceholder")}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {t("bioCharCount", { current: editBio.length })}
              </p>
            </div>
          </div>

          <div className="mt-auto flex gap-2 border-t border-border px-6 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => !deleting && setDeleteOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {isOwnProfile
                ? t("deleteOwnDialogDescription")
                : t("deleteMemberDialogDescription", {
                    name: profileUser.name ?? tCommon("unknown"),
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDeleteAccount()}
            >
              {deleting ? t("deletingAccount") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
