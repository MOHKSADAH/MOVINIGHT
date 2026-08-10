import { describe, expect, it } from "vitest";
import { getPageItems } from "./pagination";

describe("getPageItems", () => {
  it("lists every page when total is small", () => {
    expect(getPageItems(0, 5)).toEqual([
      { kind: "page", page: 0 },
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
    ]);
  });

  it("inserts ellipses for large ranges", () => {
    const items = getPageItems(5, 12);
    expect(items[0]).toEqual({ kind: "page", page: 0 });
    expect(items.some((item) => item.kind === "ellipsis")).toBe(true);
    expect(items.at(-1)).toEqual({ kind: "page", page: 11 });
  });
});
