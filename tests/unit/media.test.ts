import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MEDIA_MAP } from "@/lib/training/programs/media-map";
import { PHASE_1 } from "@/lib/training/programs/phase-1";

const pub = (url: string) => resolve(__dirname, "../../public", url.replace(/^\//, ""));

describe("exercise media", () => {
  it("maps only exercises that exist", () => {
    const slugs = new Set(PHASE_1.exercises.map((e) => e.slug));
    for (const slug of Object.keys(MEDIA_MAP)) expect(slugs.has(slug), slug).toBe(true);
  });

  it("every referenced file exists", () => {
    for (const e of PHASE_1.exercises) {
      for (const url of [e.imageUrl, e.animationUrl]) {
        if (url) expect(existsSync(pub(url)), url).toBe(true);
      }
    }
  });

  it("mapped exercises have a still; loops respect reduced motion", () => {
    for (const e of PHASE_1.exercises.filter((x) => MEDIA_MAP[x.slug])) {
      expect(e.imageUrl).toBe(`/exercise-media/${e.slug}.svg`);
      if (e.animationUrl) expect(readFileSync(pub(e.animationUrl), "utf8")).toContain("prefers-reduced-motion");
    }
  });

  it("unmapped exercises fall back to the placeholder", () => {
    const deadBug = PHASE_1.exercises.find((e) => e.slug === "dead-bug")!;
    expect(deadBug.imageUrl).toBeNull();
    expect(deadBug.animationUrl).toBeNull();
  });

  it("attribution is present", () => {
    expect(readFileSync(pub("/exercise-media/ATTRIBUTION.md"), "utf8")).toContain("CC BY-SA 4.0");
  });
});
