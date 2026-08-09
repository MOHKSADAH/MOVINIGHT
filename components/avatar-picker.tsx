"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, Loader2, Trash2, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_PRESETS,
  AVATAR_PRESETS_COLLAPSED_COUNT,
  type AvatarPresetId,
} from "@/convex/lib/avatars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = AVATAR_ALLOWED_TYPES.join(",");

const EXPAND_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

function PresetButton({
  id,
  src,
  label,
  selected,
  busy,
  onSelect,
}: {
  id: AvatarPresetId;
  src: string;
  label: string;
  selected: boolean;
  busy: boolean;
  onSelect: (src: string) => void;
}) {
  return (
    <button
      key={id}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      disabled={busy}
      onClick={() => onSelect(src)}
      className={cn(
        "overflow-hidden rounded-full ring-2 ring-transparent transition",
        "hover:ring-border focus-visible:outline-none focus-visible:ring-ring",
        "disabled:opacity-50",
        selected && "ring-primary",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        width={56}
        height={56}
        className="aspect-square w-full bg-muted"
      />
    </button>
  );
}

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

  const selectedIndex = useMemo(
    () => AVATAR_PRESETS.findIndex((preset) => preset.src === currentAvatar),
    [currentAvatar],
  );
  const selectedBeyondFold =
    selectedIndex >= AVATAR_PRESETS_COLLAPSED_COUNT;

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (selectedBeyondFold) setExpanded(true);
  }, [selectedBeyondFold]);

  const primaryPresets = AVATAR_PRESETS.slice(0, AVATAR_PRESETS_COLLAPSED_COUNT);
  const extraPresets = AVATAR_PRESETS.slice(AVATAR_PRESETS_COLLAPSED_COUNT);

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
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim()
          ? error.message
          : t("avatarUpdateFailed"),
      );
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
        <div className="grid grid-cols-5 gap-2.5">
          {primaryPresets.map((preset) => (
            <PresetButton
              key={preset.id}
              id={preset.id}
              src={preset.src}
              label={tPresets(preset.id)}
              selected={currentAvatar === preset.src}
              busy={busy}
              onSelect={(src) => void handlePreset(src)}
            />
          ))}
        </div>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="avatar-extras"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={EXPAND_TRANSITION}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-5 gap-2.5 pt-2.5">
                {extraPresets.map((preset, index) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      ...EXPAND_TRANSITION,
                      delay: Math.min(index * 0.02, 0.18),
                    }}
                  >
                    <PresetButton
                      id={preset.id}
                      src={preset.src}
                      label={tPresets(preset.id)}
                      selected={currentAvatar === preset.src}
                      busy={busy}
                      onSelect={(src) => void handlePreset(src)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {extraPresets.length > 0 ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={EXPAND_TRANSITION}
              className="inline-flex"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
            {expanded ? t("avatarShowLess") : t("avatarViewMore")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
