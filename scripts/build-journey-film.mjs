// Builds the homepage journey film (components/sections/journey-showcase.tsx) from
// live-action stock footage: downloads the clips, cuts and grades them into one
// edit, then writes the scroll-scrubbed frame sequences to public/journey/{d,m}/
// as AVIF (about a third the size of WebP for grainy live action) plus a JPEG
// poster for browsers without AVIF.
//
//   node scripts/build-journey-film.mjs [--keep]   (needs ffmpeg with libsvtav1)
//
// All clips are from Mixkit under the Mixkit Stock Video Free License
// (https://mixkit.co/license/#videoFree): commercial use allowed, no attribution
// required. Clips under Mixkit's "Restricted" license are personal-use only and
// must not be added here.

import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { cpus, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const FPS = 10; // frames per second of edit time; must match FPS in journey-showcase.tsx
const FADE = 0.6; // crossfade between shots (s)

// in/out are seconds in the source clip; speed > 1 plays it faster
const SHOTS = [
  { id: 31998, page: "man-loading-packages-on-dolly-31998", in: 0.2, out: 4.4, speed: 1 },
  { id: 31346, page: "courier-worker-preparing-boxes-on-a-loading-truck-31346", in: 6.4, out: 10.4, speed: 1 },
  { id: 31138, page: "parcel-clerk-with-a-package-on-a-dolly-31138", in: 4.6, out: 8.8, speed: 1 },
  { id: 4705, page: "young-worker-doing-inventory-4705", in: 1.5, out: 5.4, speed: 1 },
  { id: 52430, page: "trucks-move-along-the-concrete-highway-amidst-and-arid-landscape-52430", in: 7.0, out: 12.2, speed: 1.2 },
  { id: 52006, page: "trucks-and-cars-crossing-a-straight-highway-with-a-dry-52006", in: 2.0, out: 7.2, speed: 1.4 },
  { id: 4012, page: "cranes-working-on-unloading-dock-4012", in: 7.0, out: 16.0, speed: 2.4 },
  { id: 4450, page: "workers-moving-containers-from-a-cargo-ship-4450", in: 0.0, out: 7.6, speed: 1.7 },
  { id: 4011, page: "cargo-ship-full-of-containers-4011", in: 22.0, out: 34.5, speed: 2.6 },
];

// one look across every shot: a touch more contrast, less saturation, cool shadows.
// (No vignette: in 8-bit it bands visibly in open skies; the page overlay darkens the edges.)
const GRADE = "eq=contrast=1.06:saturation=0.88:brightness=-0.015,colorbalance=rs=-0.03:bs=0.04:rh=0.02:bh=-0.02";

const keep = process.argv.includes("--keep");
const work = join(tmpdir(), "eliv-journey-film");
mkdirSync(work, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });

// 1. download the 1080p sources
for (const s of SHOTS) {
  const file = join(work, `${s.id}.mp4`);
  if (existsSync(file)) continue;
  console.log(`downloading ${s.page}`);
  const res = await fetch(`https://assets.mixkit.co/videos/${s.id}/${s.id}-1080.mp4`);
  if (!res.ok) throw new Error(`${s.id}: HTTP ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

// 2. cut, retime, grade and crossfade into one 1080p edit
const lens = SHOTS.map((s) => (s.out - s.in) / s.speed);
const inputs = SHOTS.flatMap((s) => ["-i", join(work, `${s.id}.mp4`)]);
const parts = SHOTS.map(
  (s, i) =>
    `[${i}:v]trim=${s.in}:${s.out},setpts=(PTS-STARTPTS)/${s.speed},fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,${GRADE},format=yuv420p[v${i}]`,
);
let chain = "[v0]";
let offset = 0;
const starts = [0];
for (let i = 1; i < SHOTS.length; i++) {
  offset += lens[i - 1] - FADE;
  starts.push(offset);
  const out = i === SHOTS.length - 1 ? "[out]" : `[x${i}]`;
  parts.push(`${chain}[v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}${out}`);
  chain = out;
}
const total = offset + lens[lens.length - 1];
const master = join(work, "journey-master.mp4");
console.log(`rendering ${total.toFixed(2)} s edit`);
ff([...inputs, "-filter_complex", parts.join(";"), "-map", "[out]", "-an", "-c:v", "libx264", "-crf", "16", "-preset", "slow", master]);

// 3. frame sequences: 1600w for desktop, 960w for mobile. ffmpeg's AVIF muxer writes one
// image per run, so frames go out as PNG first and are encoded in parallel.
const run = promisify(execFile);
for (const [set, width, crf] of [["d", 1600, 34], ["m", 960, 36]]) {
  const png = join(work, `png-${set}`);
  rmSync(png, { recursive: true, force: true });
  mkdirSync(png);
  ff(["-i", master, "-vf", `fps=${FPS},scale=${width}:-2:flags=lanczos`, "-start_number", "0", join(png, "%03d.png")]);
  const dir = join("public", "journey", set);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const queue = readdirSync(png).sort();
  const encode = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      await run("ffmpeg", ["-v", "error", "-y", "-i", join(png, f), "-c:v", "libsvtav1", "-crf", String(crf), "-preset", "6", "-pix_fmt", "yuv420p", "-still-picture", "1", "-svtav1-params", "lp=1", "-f", "avif", join(dir, f.replace(".png", ".avif"))]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, cpus().length) }, encode));
  console.log(`${set}: ${readdirSync(dir).length} frames`);
}
ff(["-ss", "1", "-i", master, "-frames:v", "1", "-vf", "scale=1600:-2:flags=lanczos", "-q:v", "4", join("public", "journey", "poster.jpg")]);

console.log("shot start times (s):", starts.map((t) => t.toFixed(2)).join(", "));
if (!keep) rmSync(work, { recursive: true, force: true });
else console.log(`sources and master kept in ${work}`);
