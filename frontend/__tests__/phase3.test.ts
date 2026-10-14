import { formatWithUnit, round3, startQty, stepDown, stepUp } from "@/lib/quantity";
import { categoryHref, findSub, flattenSubs, pathTo, trailOf } from "@/lib/utils/categories";
import type { Category, SubCategory } from "@/lib/types";

const kg = { allowDecimal: true, step: 0.5, minQty: 0.5 };
const piece = { allowDecimal: false, step: 1, minQty: 1 };

describe("quantity steps", () => {
  it("starts at the smallest allowed quantity", () => {
    expect(startQty(kg)).toBe(0.5);
    expect(startQty(piece)).toBe(1);
    expect(startQty(null)).toBe(1);
  });

  it("steps up by the unit step without float noise", () => {
    expect(stepUp(0.5, kg, 10)).toBe(1);
    expect(stepUp(0.1, { allowDecimal: true, step: 0.2, minQty: 0.1 }, 10)).toBe(0.3);
    expect(stepUp(2, piece, 10)).toBe(3);
  });

  it("does not step above the stock", () => {
    expect(stepUp(9.5, kg, 10)).toBe(10);
    expect(stepUp(10, kg, 10)).toBeNull();
    expect(stepUp(3, piece, 3)).toBeNull();
  });

  it("steps down, and says so when it would go below the minimum", () => {
    expect(stepDown(1, kg)).toBe(0.5);
    expect(stepDown(0.5, kg)).toBeNull();
    expect(stepDown(2, piece)).toBe(1);
    expect(stepDown(1, piece)).toBeNull();
  });

  it("writes an amount with its unit", () => {
    expect(formatWithUnit(0.5, { label: "kg" }, "en")).toBe("0.5 kg");
    expect(formatWithUnit(2, { label: "কেজি" }, "bn")).toBe("২ কেজি");
    expect(formatWithUnit(3, null, "en")).toBe("3");
  });

  it("rounds to three places", () => {
    expect(round3(0.1 + 0.2)).toBe(0.3);
  });
});

const sub = (slug: string, children: SubCategory[] = []): SubCategory => ({ id: slug, slug, name: slug.toUpperCase(), categorySlug: "fish", productCount: 1, children });
const fish: Category = {
  id: "fish",
  slug: "fish",
  name: "Fish",
  description: "",
  icon: "",
  productCount: 5,
  subCategories: [sub("fresh", [sub("rui"), sub("pangas")]), sub("dried")],
};

describe("category tree helpers", () => {
  it("flattens every level with its depth", () => {
    expect(flattenSubs(fish.subCategories).map((s) => [s.slug, s.depth])).toEqual([
      ["fresh", 0],
      ["rui", 1],
      ["pangas", 1],
      ["dried", 0],
    ]);
  });

  it("finds a category at any depth", () => {
    expect(findSub(fish.subCategories, "pangas")?.slug).toBe("pangas");
    expect(findSub(fish.subCategories, "nope")).toBeUndefined();
  });

  it("gives the path from the top level down", () => {
    expect(pathTo(fish, "rui")).toEqual(["fish", "fresh", "rui"]);
    expect(pathTo(fish, "fish")).toEqual(["fish"]);
    expect(pathTo(fish, "missing")).toEqual([]);
  });

  it("builds the trail with each level's own children", () => {
    const trail = trailOf(fish, "rui");
    expect(trail.map((t) => t.slug)).toEqual(["fish", "fresh", "rui"]);
    expect(trail[1].children.map((c) => c.slug)).toEqual(["rui", "pangas"]);
    expect(trailOf(fish).length).toBe(1);
  });

  it("links the top level to its page and deeper ones to ?sub=", () => {
    expect(categoryHref("fish", "fish")).toBe("/category/fish");
    expect(categoryHref("fish", "rui")).toBe("/category/fish?sub=rui");
  });
});
