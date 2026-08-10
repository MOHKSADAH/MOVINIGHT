"use client";

import { useReducer, useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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

type RestaurantCity = "dammam" | "saihat" | "qatif";

type AddFormState = {
  name: string;
  category: string;
  address: string;
  notes: string;
  priceRange: string;
  city: "" | RestaurantCity;
  imageUrl: string;
  nameError?: string;
  categoryError?: string;
};

const INITIAL_ADD_FORM: AddFormState = {
  name: "",
  category: "",
  address: "",
  notes: "",
  priceRange: "",
  city: "",
  imageUrl: "",
};

type AddFormAction =
  | { type: "patch"; patch: Partial<AddFormState> }
  | { type: "reset" }
  | {
      type: "validate";
      nameError?: string;
      categoryError?: string;
    };

function addFormReducer(state: AddFormState, action: AddFormAction): AddFormState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "reset":
      return INITIAL_ADD_FORM;
    case "validate":
      return {
        ...state,
        nameError: action.nameError,
        categoryError: action.categoryError,
      };
    default:
      return state;
  }
}

const CATEGORY_SLUGS = [
  "All",
  "Saudi",
  "Lebanese",
  "Yemeni",
  "Seafood",
  "Kebab",
  "Sandwiches",
  "Pizza",
  "Burgers",
  "Sushi",
  "Chinese",
  "Indian",
  "Mexican",
  "Italian",
  "Thai",
  "Steakhouse",
  "Other",
] as const;

const CATEGORY_FORM_SLUGS = CATEGORY_SLUGS.filter(
  (c): c is Exclude<(typeof CATEGORY_SLUGS)[number], "All"> => c !== "All",
);

const CITY_SLUGS = ["All", "dammam", "saihat", "qatif"] as const;

function categoryLabel(
  slug: string,
  t: ReturnType<typeof useTranslations<"food">>,
): string {
  const keys: Record<string, string> = {
    All: "categoryAll",
    Saudi: "categorySaudi",
    Lebanese: "categoryLebanese",
    Yemeni: "categoryYemeni",
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

function cityLabel(
  slug: string,
  t: ReturnType<typeof useTranslations<"food">>,
): string {
  if (slug === "All") return t("cityAll");
  if (slug === "dammam") return t("cityDammam");
  if (slug === "saihat") return t("citySaihat");
  if (slug === "qatif") return t("cityQatif");
  return slug;
}

const PRICE_RANGES = ["$", "$$", "$$$"];

type Restaurant = {
  _id: Id<"restaurants">;
  name: string;
  category: string;
  address?: string;
  notes?: string;
  priceRange?: string;
  city?: RestaurantCity;
  imageUrl?: string;
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
  const [pickedRestaurant, setPickedRestaurant] = useState<Restaurant | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCity, setActiveCity] = useState("All");
  const [form, dispatchForm] = useReducer(addFormReducer, INITIAL_ADD_FORM);
  const [saving, setSaving] = useState(false);

  const restaurants = useQuery(api.restaurants.getRestaurants);
  const addRestaurant = useMutation(api.restaurants.addRestaurant);
  const deleteRestaurant = useMutation(api.restaurants.deleteRestaurant);
  const toggleUpvote = useMutation(api.restaurants.toggleUpvote);

  const filtered =
    restaurants === undefined
      ? undefined
      : restaurants.filter((r) => {
          const categoryOk =
            activeCategory === "All" || r.category === activeCategory;
          const cityOk =
            activeCity === "All" || r.city === activeCity;
          return categoryOk && cityOk;
        });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextNameError = !form.name.trim() ? t("nameRequired") : undefined;
    const nextCategoryError = !form.category ? t("categoryRequired") : undefined;
    dispatchForm({
      type: "validate",
      nameError: nextNameError,
      categoryError: nextCategoryError,
    });
    if (nextNameError || nextCategoryError) return;

    setSaving(true);
    try {
      await addRestaurant({
        name: form.name.trim(),
        category: form.category,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        priceRange: form.priceRange || undefined,
        city: form.city || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      toast.success(t("toastAdded"));
      dispatchForm({ type: "reset" });
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
    const pick = filtered[Math.floor(Math.random() * filtered.length)]!;
    setPickedRestaurant(pick as Restaurant);
    setPickedOpen(true);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
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

        <div className="mb-3 flex flex-wrap gap-2">
          {CITY_SLUGS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setActiveCity(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                activeCity === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {cityLabel(c, t)}
            </button>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORY_SLUGS.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                activeCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {categoryLabel(cat, t)}
            </button>
          ))}
        </div>

        {filtered === undefined ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title={
              activeCategory === "All" && activeCity === "All"
                ? tEmpty("noRestaurantsTitle")
                : tEmpty("noRestaurantsCategoryTitle", {
                    category:
                      activeCategory !== "All"
                        ? categoryLabel(activeCategory, t)
                        : cityLabel(activeCity, t),
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
                className="flex items-stretch gap-3 overflow-hidden rounded-lg border border-border bg-card"
              >
                {r.imageUrl ? (
                  <div className="relative hidden w-28 shrink-0 sm:block">
                    <Image
                      src={r.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                ) : null}
                <div className="flex min-w-0 flex-1 items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{r.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabel(r.category, t)}
                      </Badge>
                      {r.city ? (
                        <Badge variant="outline" className="text-xs">
                          {cityLabel(r.city, t)}
                        </Badge>
                      ) : null}
                      {r.priceRange ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.priceRange}
                        </span>
                      ) : null}
                    </div>
                    {r.address ? (
                      <div className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="truncate text-xs text-muted-foreground">
                          {r.address}
                        </p>
                      </div>
                    ) : null}
                    {r.notes ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {r.notes}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {tCommon("addedBy", { name: r.addedByName })}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant={r.hasUpvoted ? "default" : "outline"}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => handleUpvote(r._id)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {r.upvotes.length}
                    </Button>
                    {r.isOwner ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:border-destructive hover:text-destructive"
                        onClick={() => handleDelete(r._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) dispatchForm({ type: "reset" });
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addDialogTitle")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => void handleAdd(e)}
            noValidate
            className="space-y-3"
          >
            <FieldGroup className="gap-3">
              <Field data-invalid={form.nameError ? true : undefined}>
                <FieldLabel htmlFor="restaurant-name">{tCommon("name")}</FieldLabel>
                <Input
                  id="restaurant-name"
                  placeholder={t("restaurantNamePlaceholder")}
                  value={form.name}
                  onChange={(e) => {
                    dispatchForm({
                      type: "patch",
                      patch: {
                        name: e.target.value,
                        ...(form.nameError ? { nameError: undefined } : {}),
                      },
                    });
                  }}
                  autoFocus
                  aria-invalid={form.nameError ? true : undefined}
                />
                <FieldError>{form.nameError}</FieldError>
              </Field>
              <Field data-invalid={form.categoryError ? true : undefined}>
                <FieldLabel htmlFor="restaurant-category">
                  {t("categoryLabel")}
                </FieldLabel>
                <select
                  id="restaurant-category"
                  value={form.category}
                  aria-label={t("categoryLabel")}
                  onChange={(e) => {
                    dispatchForm({
                      type: "patch",
                      patch: {
                        category: e.target.value,
                        ...(form.categoryError
                          ? { categoryError: undefined }
                          : {}),
                      },
                    });
                  }}
                  aria-invalid={form.categoryError ? true : undefined}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{t("selectCategory")}</option>
                  {CATEGORY_FORM_SLUGS.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabel(cat, t)}
                    </option>
                  ))}
                </select>
                <FieldError>{form.categoryError}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="restaurant-city">{t("cityLabel")}</FieldLabel>
                <select
                  id="restaurant-city"
                  value={form.city}
                  aria-label={t("cityLabel")}
                  onChange={(e) =>
                    dispatchForm({
                      type: "patch",
                      patch: {
                        city: e.target.value as "" | RestaurantCity,
                      },
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{tCommon("optionalPlain")}</option>
                  <option value="dammam">{t("cityDammam")}</option>
                  <option value="saihat">{t("citySaihat")}</option>
                  <option value="qatif">{t("cityQatif")}</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel
                    htmlFor="restaurant-price"
                    className="text-muted-foreground"
                  >
                    {t("priceRangeLabel")}
                  </FieldLabel>
                  <select
                    id="restaurant-price"
                    value={form.priceRange}
                    aria-label={t("priceRangeLabel")}
                    onChange={(e) =>
                      dispatchForm({
                        type: "patch",
                        patch: { priceRange: e.target.value },
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">{tCommon("optionalPlain")}</option>
                    {PRICE_RANGES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor="restaurant-address"
                    className="text-muted-foreground"
                  >
                    {t("addressLabel")}
                  </FieldLabel>
                  <Input
                    id="restaurant-address"
                    placeholder={tCommon("optionalPlain")}
                    value={form.address}
                    onChange={(e) =>
                      dispatchForm({
                        type: "patch",
                        patch: { address: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel
                  htmlFor="restaurant-image"
                  className="text-muted-foreground"
                >
                  {t("imageUrlLabel")}
                </FieldLabel>
                <Input
                  id="restaurant-image"
                  placeholder={t("imageUrlPlaceholder")}
                  value={form.imageUrl}
                  onChange={(e) =>
                    dispatchForm({
                      type: "patch",
                      patch: { imageUrl: e.target.value },
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor="restaurant-notes"
                  className="text-muted-foreground"
                >
                  {t("notesLabel")}
                </FieldLabel>
                <Input
                  id="restaurant-notes"
                  placeholder={t("notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) =>
                    dispatchForm({
                      type: "patch",
                      patch: { notes: e.target.value },
                    })
                  }
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? tCommon("adding") : tCommon("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pickedOpen} onOpenChange={setPickedOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t("pickDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          {pickedRestaurant ? (
            <div className="space-y-3 py-4">
              {pickedRestaurant.imageUrl ? (
                <div className="relative mx-auto h-36 w-full overflow-hidden rounded-lg">
                  <Image
                    src={pickedRestaurant.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="384px"
                  />
                </div>
              ) : null}
              <div className="text-2xl font-bold">{pickedRestaurant.name}</div>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary">
                  {categoryLabel(pickedRestaurant.category, t)}
                </Badge>
                {pickedRestaurant.city ? (
                  <Badge variant="outline">
                    {cityLabel(pickedRestaurant.city, t)}
                  </Badge>
                ) : null}
                {pickedRestaurant.priceRange ? (
                  <span className="font-mono text-sm text-muted-foreground">
                    {pickedRestaurant.priceRange}
                  </span>
                ) : null}
              </div>
              {pickedRestaurant.address ? (
                <div className="flex items-center justify-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {pickedRestaurant.address}
                  </p>
                </div>
              ) : null}
              {pickedRestaurant.notes ? (
                <p className="text-sm italic text-muted-foreground">
                  {pickedRestaurant.notes}
                </p>
              ) : null}
            </div>
          ) : null}
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
