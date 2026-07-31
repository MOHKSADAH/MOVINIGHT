"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_PRESETS,
} from "@/convex/lib/avatars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = AVATAR_ALLOWED_TYPES.join(",");

export function AvatarPicker({
  currentAvatar,
  fallbackInitial,
  className,
}: {
  currentAvatar?: string;
  /** Shown while no avatar is set — usually the first letter of the name. */
  fallbackInitial?: string;
  className?: string;
}) {
  const t = useTranslations("members");
  const tPresets = useTranslations("members.avatarPresets");

  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setUploadedAvatar = useMutation(api.users.setUploadedAvatar);
  const setPresetAvatar = useMutation(api.users.setPresetAvatar);
  const clearAvatar = useMutation(api.users.clearAvatar);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Let the same file be re-picked after a failed attempt.
    event.target.value = "";
    if (!file) return;

    if (!(AVATAR_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t("avatarTypeError"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(t("avatarSizeError"));
      return;
    }

    setBusy(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };
      await setUploadedAvatar({ storageId });
      toast.success(t("avatarUpdated"));
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error(t("avatarUploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handlePreset = async (src: string) => {
    setBusy(true);
    try {
      await setPresetAvatar({ src });
      toast.success(t("avatarUpdated"));
    } catch {
      toast.error(t("avatarUpdateFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await clearAvatar();
      toast.success(t("avatarRemoved"));
    } catch {
      toast.error(t("avatarUpdateFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Avatar className="size-20 shrink-0">
          <AvatarImage src={currentAvatar} />
          <AvatarFallback className="text-2xl">
            {fallbackInitial ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {t("avatarUploadAction")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("avatarUploadHint")}</p>
          {currentAvatar ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              disabled={busy}
              onClick={() => void handleClear()}
            >
              <Trash2 className="h-3 w-3" />
              {t("avatarRemoveAction")}
            </button>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("avatarPresetsLabel")}
        </p>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_PRESETS.map((preset) => {
            const selected = currentAvatar === preset.src;
            return (
              <button
                key={preset.id}
                type="button"
                title={tPresets(preset.id)}
                aria-label={tPresets(preset.id)}
                aria-pressed={selected}
                disabled={busy}
                onClick={() => void handlePreset(preset.src)}
                className={cn(
                  "overflow-hidden rounded-full ring-2 ring-transparent transition",
                  "hover:ring-border focus-visible:outline-none focus-visible:ring-ring",
                  "disabled:opacity-50",
                  selected && "ring-primary",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.src}
                  alt={tPresets(preset.id)}
                  width={48}
                  height={48}
                  className="aspect-square w-full"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
