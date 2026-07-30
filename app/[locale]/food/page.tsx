"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Utensils, Plus, ThumbsUp, Trash2, Shuffle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { useTranslations } from "next-intl";

const CATEGORY_SLUGS = [
  "All",
  "Pizza",
  "Burgers",
  "Sushi",
  "Chinese",
  "Indian",
  "Mexican",
  "Italian",
  "Thai",
  "Kebab",
  "Sandwiches",
  "Seafood",
  "Steakhouse",
  "Other",
] as const;

function categoryLabel(
  slug: string,
  t: ReturnType<typeof useTranslations<"food">>,
): string {
  const keys: Record<string, string> = {
    All: "categoryAll",
    Pizza: "categoryPizza",
    Burgers: "categoryBurgers",
    Sushi: "categorySushi",
    Chinese: "categoryChinese",
    Indian: "categoryIndian",
    Mexican: "categoryMexican",
    Italian: "categoryItalian",
    Thai: "categoryThai",
    Kebab: "categoryKebab",
    Sandwiches: "categorySandwiches",
    Seafood: "categorySeafood",
    Steakhouse: "categorySteakhouse",
    Other: "categoryOther",
  };
  const key = keys[slug];
  return key ? t(key as "categoryAll") : slug;
}

const PRICE_RANGES = ["$", "$$", "$$$"];

type Restaurant = {
  _id: Id<"restaurants">;
  name: string;
  category: string;
  address?: string;
  notes?: string;
  priceRange?: string;
  upvotes: Id<"users">[];
  addedByName: string;
  hasUpvoted: boolean;
  isOwner: boolean;
};

export default function FoodPage() {
  const t = useTranslations("food");
  const tEmpty = useTranslations("empty");
  const tCommon = useTranslations("common");

  const [addOpen, setAddOpen] = useState(false);
  const [pickedOpen, setPickedOpen] = useState(false);
  const [pickedRestaurant, setPickedRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [saving, setSaving] = useState(false);

  const restaurants = useQuery(api.restaurants.getRestaurants);
  const addRestaurant = useMutation(api.restaurants.addRestaurant);
  const deleteRestaurant = useMutation(api.restaurants.deleteRestaurant);
  const toggleUpvote = useMutation(api.restaurants.toggleUpvote);

  const filtered =
    restaurants === undefined
      ? undefined
      : activeCategory === "All"
        ? restaurants
        : restaurants.filter((r) => r.category === activeCategory);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) return;
    setSaving(true);
    try {
      await addRestaurant({
        name: name.trim(),
        category,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        priceRange: priceRange || undefined,
      });
      toast.success(t("toastAdded"));
      setName("");
      setCategory("");
      setAddress("");
      setNotes("");
      setPriceRange("");
      setAddOpen(false);
    } catch {
      toast.error(t("toastAddFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (restaurantId: Id<"restaurants">) => {
    try {
      await deleteRestaurant({ restaurantId });
      toast.success(t("toastRemoved"));
    } catch {
      toast.error(t("toastRemoveFailed"));
    }
  };

  const handleUpvote = async (restaurantId: Id<"restaurants">) => {
    try {
      await toggleUpvote({ restaurantId });
    } catch {
      toast.error(t("toastUpvoteFailed"));
    }
  };

  const handlePickForMe = () => {
    if (!filtered || filtered.length === 0) {
      toast.error(t("toastNothingToPick"));
      return;
    }
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setPickedRestaurant(pick as Restaurant);
    setPickedOpen(true);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              className="gap-2"
              onClick={handlePickForMe}
              disabled={!filtered || filtered.length === 0}
            >
              <Shuffle className="h-4 w-4" />
              {t("pickForMe")}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {tCommon("add")}
            </Button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORY_SLUGS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-sm border transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
              )}
            >
              {categoryLabel(cat, t)}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered === undefined ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title={
              activeCategory === "All"
                ? tEmpty("noRestaurantsTitle")
                : tEmpty("noRestaurantsCategoryTitle", {
                    category: categoryLabel(activeCategory, t),
                  })
            }
            description={tEmpty("noRestaurantsDesc")}
            actionLabel={tEmpty("addRestaurantAction")}
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div
                key={r._id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{r.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {r.category}
                    </Badge>
                    {r.priceRange && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {r.priceRange}
                      </span>
                    )}
                  </div>
                  {r.address && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">
                        {r.address}
                      </p>
                    </div>
                  )}
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {r.notes}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {tCommon("addedBy", { name: r.addedByName })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant={r.hasUpvoted ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleUpvote(r._id)}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {r.upvotes.length}
                  </Button>
                  {r.isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive"
                      onClick={() => handleDelete(r._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Restaurant Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addDialogTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="restaurant-name">
                {tCommon("name")}
              </label>
              <Input
                id="restaurant-name"
                placeholder={t("restaurantNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="restaurant-category">
                {t("categoryLabel")}
              </label>
              <select
                id="restaurant-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{t("selectCategory")}</option>
                {CATEGORY_SLUGS.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat, t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="restaurant-price"
                >
                  {t("priceRangeLabel")}
                </label>
                <select
                  id="restaurant-price"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{tCommon("optionalPlain")}</option>
                  {PRICE_RANGES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="restaurant-address"
                >
                  {t("addressLabel")}
                </label>
                <Input
                  id="restaurant-address"
                  placeholder={tCommon("optionalPlain")}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="restaurant-notes"
              >
                {t("notesLabel")}
              </label>
              <Input
                id="restaurant-notes"
                placeholder={t("notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving || !name.trim() || !category}>
                {saving ? tCommon("adding") : tCommon("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Picked Restaurant Dialog */}
      <Dialog open={pickedOpen} onOpenChange={setPickedOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">{t("pickDialogTitle")}</DialogTitle>
          </DialogHeader>
          {pickedRestaurant && (
            <div className="py-4 space-y-3">
              <div className="text-4xl font-bold">{pickedRestaurant.name}</div>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary">{pickedRestaurant.category}</Badge>
                {pickedRestaurant.priceRange && (
                  <span className="text-sm font-mono text-muted-foreground">
                    {pickedRestaurant.priceRange}
                  </span>
                )}
              </div>
              {pickedRestaurant.address && (
                <div className="flex items-center justify-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {pickedRestaurant.address}
                  </p>
                </div>
              )}
              {pickedRestaurant.notes && (
                <p className="text-sm text-muted-foreground italic">
                  {pickedRestaurant.notes}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="justify-center gap-2">
            <Button variant="outline" onClick={handlePickForMe}>
              {t("pickAgain")}
            </Button>
            <Button onClick={() => setPickedOpen(false)}>{t("letsGo")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
