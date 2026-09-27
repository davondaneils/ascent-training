// Downloads Everkinetic illustrations (CC BY-SA 4.0) for mapped exercises and writes:
//   public/exercise-media/<slug>.svg       still (start frame)
//   public/exercise-media/<slug>-loop.svg  both frames, crossfading; still under prefers-reduced-motion
//   public/exercise-media/ATTRIBUTION.md
// Modification: line colour changed from #333 to Ascent's text colour. Output stays CC BY-SA 4.0.
// Run once: npm run media:fetch (files are committed).

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { MEDIA_MAP } from "../lib/training/programs/media-map";

const BASE = "https://raw.githubusercontent.com/everkinetic/data/main/dist/svg";
const OUT = resolve(process.cwd(), "public/exercise-media");
const LINE = "#23262d";

async function get(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function recolour(svg: string): string {
  return svg.replace(/fill="#333"/g, `fill="${LINE}"`);
}

function viewBox(svg: string): string {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) throw new Error("SVG without viewBox");
  return m[1];
}

/** Inner markup of an <svg> element. */
function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

function still(svg: string): string {
  return `<svg viewBox="${viewBox(svg)}" xmlns="http://www.w3.org/2000/svg">${inner(svg)}</svg>\n`;
}

// Frame B sits on top (both frames are opaque) and fades in/out: ~1s hold per position.
function loop(a: string, b: string): string {
  const vb = viewBox(a);
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><style>
.b{animation:t 2.6s ease-in-out infinite}
@keyframes t{0%,38%{opacity:0}50%,88%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.b{animation:none;opacity:0}}
</style><g>${inner(a)}</g><g class="b">${inner(b)}</g></svg>\n`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const cache = new Map<string, [string, string]>();
  for (const [slug, src] of Object.entries(MEDIA_MAP)) {
    let frames = cache.get(src.everkineticId);
    if (!frames) {
      frames = [
        recolour(await get(`${BASE}/${src.everkineticId}-relaxation.svg`)),
        recolour(await get(`${BASE}/${src.everkineticId}-tension.svg`)),
      ];
      cache.set(src.everkineticId, frames);
    }
    writeFileSync(resolve(OUT, `${slug}.svg`), still(frames[0]));
    if (!src.stillOnly) writeFileSync(resolve(OUT, `${slug}-loop.svg`), loop(frames[0], frames[1]));
    console.log(`${slug} ← ${src.everkineticId} (${src.match})`);
  }

  const rows = Object.entries(MEDIA_MAP)
    .map(([slug, s]) => `| ${slug} | ${s.everkineticId} | ${s.match} |`)
    .join("\n");
  writeFileSync(
    resolve(OUT, "ATTRIBUTION.md"),
    `# Exercise illustrations

Illustrations by **Everkinetic** (https://github.com/everkinetic/data), licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Changes: line colour adjusted; the two frames of each exercise combined into a looping SVG.
These modified files are also licensed under CC BY-SA 4.0. The rest of Ascent is not affected.

| Ascent exercise | Everkinetic id | Match |
| --- | --- | --- |
${rows}
`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
