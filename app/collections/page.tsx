"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookMarked, Plus, Film } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";

export default function CollectionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const collections = useQuery(api.collections.getCollections);
  const createCollection = useMutation(api.collections.createCollection);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Collection created");
      setName("");
      setDescription("");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Collections</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Curated movie lists for any occasion
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </div>

        {/* Grid */}
        {collections === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No collections yet"
            description="Create one to curate movies for any occasion — horror nights, comfort rewatches, whatever fits."
            actionLabel="New collection"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <Link key={col._id} href={`/collections/${col._id}`}>
                <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/70 transition-colors cursor-pointer h-full">
                  {/* Poster row */}
                  <div className="flex h-28 bg-muted overflow-hidden">
                    {col.posters.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    ) : (
                      col.posters.map((poster, i) => (
                        <div
                          key={i}
                          className="relative flex-1 overflow-hidden"
                          style={{ flexBasis: `${100 / col.posters.length}%` }}
                        >
                          <Image
                            src={poster}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="150px"
                          />
                        </div>
                      ))
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-tight truncate">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {col.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {col.movieCount} {col.movieCount === 1 ? "movie" : "movies"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        by {col.ownerName}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="collection-name">
                Name
              </label>
              <Input
                id="collection-name"
                placeholder="Horror Night, 90s Classics..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="collection-description"
              >
                Description (optional)
              </label>
              <Input
                id="collection-description"
                placeholder="What's this collection about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
