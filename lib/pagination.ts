export type PageNavItem =
  | { kind: "page"; page: number }
  | { kind: "ellipsis"; id: "start" | "end" };

/** Build pagination items with stable identities (never rely on array index as React key). */
export function getPageItems(current: number, total: number): PageNavItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, page) => ({
      kind: "page" as const,
      page,
    }));
  }

  const items: PageNavItem[] = [{ kind: "page", page: 0 }];
  if (current > 2) items.push({ kind: "ellipsis", id: "start" });

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let page = start; page <= end; page++) {
    items.push({ kind: "page", page });
  }

  if (current < total - 3) items.push({ kind: "ellipsis", id: "end" });
  items.push({ kind: "page", page: total - 1 });
  return items;
}
