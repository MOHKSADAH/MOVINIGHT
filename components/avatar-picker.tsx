"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, Loader2, Trash2, Upload } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_PRESETS,
  AVATAR_PRESETS_COLLAPSED_COUNT,
  isAvatarPresetSrc,
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

/** Draft avatar choice — applied only when the parent form saves. */
export type AvatarSelection =
  | { kind: "keep" }
  | { kind: "preset"; src: string }
  | { kind: "clear" }
  | { kind: "upload"; file: File; previewUrl: string };

export function avatarSelectionPreview(
  selection: AvatarSelection,
  currentAvatar: string | undefined,
): string | undefined {
  switch (selection.kind) {
    case "keep":
      return currentAvatar;
    case "preset":
      return selection.src;
    case "clear":
      return undefined;
    case "upload":
      return selection.previewUrl;
  }
}

export async function applyAvatarSelection(
  selection: AvatarSelection,
  actions: {
    generateUploadUrl: () => Promise<string>;
    setUploadedAvatar: (args: {
      storageId: Id<"_storage">;
    }) => Promise<unknown>;
    setPresetAvatar: (args: { src: string }) => Promise<unknown>;
    clearAvatar: () => Promise<unknown>;
  },
): Promise<boolean> {
  if (selection.kind === "keep") return false;

  if (selection.kind === "clear") {
    await actions.clearAvatar();
    return true;
  }

  if (selection.kind === "preset") {
    await actions.setPresetAvatar({ src: selection.src });
    return true;
  }

  const uploadUrl = await actions.generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": selection.file.type },
    body: selection.file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  const { storageId } = (await response.json()) as {
    storageId: Id<"_storage">;
  };
  await actions.setUploadedAvatar({ storageId });
  return true;
}

function PresetButton({
  id,
  src,
  label,
  selected,
  disabled,
  onSelect,
}: {
  id: AvatarPresetId;
  src: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (src: string) => void;
}) {
  return (
    <button
      key={id}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
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
  selection,
  onSelectionChange,
  fallbackInitial,
  disabled = false,
  className,
}: {
  currentAvatar?: string;
  selection: AvatarSelection;
  onSelectionChange: (next: AvatarSelection) => void;
  /** Shown while no avatar is set — usually the first letter of the name. */
  fallbackInitial?: string;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("members");
  const tPresets = useTranslations("members.avatarPresets");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedByUser, setExpandedByUser] = useState(false);

  const previewSrc = avatarSelectionPreview(selection, currentAvatar);

  const selectedPresetSrc =
    selection.kind === "preset"
      ? selection.src
      : selection.kind === "keep" &&
          currentAvatar &&
          isAvatarPresetSrc(currentAvatar)
        ? currentAvatar
        : undefined;

  const selectedIndex = useMemo(
    () =>
      selectedPresetSrc
        ? AVATAR_PRESETS.findIndex((preset) => preset.src === selectedPresetSrc)
        : -1,
    [selectedPresetSrc],
  );
  const selectedBeyondFold =
    selectedIndex >= AVATAR_PRESETS_COLLAPSED_COUNT;
  const expanded = expandedByUser || selectedBeyondFold;

  const primaryPresets = AVATAR_PRESETS.slice(0, AVATAR_PRESETS_COLLAPSED_COUNT);
  const extraPresets = AVATAR_PRESETS.slice(AVATAR_PRESETS_COLLAPSED_COUNT);

  const replaceSelection = (next: AvatarSelection) => {
    if (selection.kind === "upload") {
      URL.revokeObjectURL(selection.previewUrl);
    }
    onSelectionChange(next);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

    replaceSelection({
      kind: "upload",
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const busy = disabled;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Avatar className="size-20 shrink-0">
          <AvatarImage src={previewSrc} />
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
          {previewSrc ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              disabled={busy}
              onClick={() => replaceSelection({ kind: "clear" })}
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
          onChange={handleFileChange}
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
              selected={selectedPresetSrc === preset.src}
              disabled={busy}
              onSelect={(src) => replaceSelection({ kind: "preset", src })}
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
                      selected={selectedPresetSrc === preset.src}
                      disabled={busy}
                      onSelect={(src) =>
                        replaceSelection({ kind: "preset", src })
                      }
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
            onClick={() => setExpandedByUser((value) => !value)}
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
