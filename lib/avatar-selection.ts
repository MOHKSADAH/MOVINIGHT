import type { Id } from "@/convex/_generated/dataModel";

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
