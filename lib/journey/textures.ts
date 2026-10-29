import * as THREE from "three";

/**
 * Every texture in the journey scene is generated on a canvas at start-up.
 * Nothing is fetched over the network, so the scene is ready on first paint
 * and scrubbing never waits on an image decode.
 */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Deterministic PRNG so the scene looks identical on every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RIBS = 46;

/** Grayscale corrugated side panel. Tinted by the material colour. */
function drawCorrugation(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#e9e9e9";
  ctx.fillRect(0, 0, w, h);
  const pitch = w / RIBS;
  for (let i = 0; i < RIBS; i++) {
    const x = i * pitch;
    const g = ctx.createLinearGradient(x, 0, x + pitch, 0);
    g.addColorStop(0, "#c4c4c4");
    g.addColorStop(0.18, "#ffffff");
    g.addColorStop(0.5, "#ececec");
    g.addColorStop(0.78, "#a9a9a9");
    g.addColorStop(1, "#cfcfcf");
    ctx.fillStyle = g;
    ctx.fillRect(x, h * 0.06, pitch, h * 0.88);
  }
  // top & bottom rails
  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
  ctx.fillStyle = "#7c7c7c";
  ctx.fillRect(0, h * 0.055, w, 2);
  ctx.fillRect(0, h * 0.94, w, 2);
  // corner posts
  ctx.fillStyle = "#8d8d8d";
  ctx.fillRect(0, 0, pitch * 0.9, h);
  ctx.fillRect(w - pitch * 0.9, 0, pitch * 0.9, h);
}

export function containerSideTexture(label?: { text: string; sub: string; color: string }) {
  const { c, ctx } = canvas(1536, 328);
  drawCorrugation(ctx, c.width, c.height);
  if (label) {
    ctx.save();
    ctx.fillStyle = label.color;
    ctx.font = "900 150px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.92;
    ctx.fillText(label.text, 120, c.height * 0.44);
    ctx.font = "700 40px Arial, Helvetica, sans-serif";
    ctx.fillText(label.sub, 128, c.height * 0.76);
    ctx.restore();
  }
  // small id plate, like a real box
  ctx.fillStyle = "rgba(20,20,20,0.75)";
  ctx.font = "700 22px monospace";
  ctx.fillText("ELVU 204381 7", c.width - 260, 46);
  ctx.fillText("45G1", c.width - 260, 76);
  return tex(c);
}

export function containerBumpTexture() {
  const { c, ctx } = canvas(512, 8);
  const pitch = c.width / RIBS;
  for (let x = 0; x < c.width; x++) {
    const v = 0.5 + 0.5 * Math.sin(((x % pitch) / pitch) * Math.PI * 2);
    const g = Math.round(v * 255);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(x, 0, 1, c.height);
  }
  return tex(c, false);
}

export function containerDoorTexture() {
  const { c, ctx } = canvas(256, 272);
  const w = c.width, h = c.height;
  ctx.fillStyle = "#dedede";
  ctx.fillRect(0, 0, w, h);
  // two doors with horizontal corrugation
  for (let y = 18; y < h - 18; y += 12) {
    const g = ctx.createLinearGradient(0, y, 0, y + 12);
    g.addColorStop(0, "#f6f6f6");
    g.addColorStop(1, "#bdbdbd");
    ctx.fillStyle = g;
    ctx.fillRect(14, y, w - 28, 12);
  }
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(w / 2 - 2, 14, 4, h - 28);
  // locking bars
  ctx.fillStyle = "#6e6e6e";
  for (const x of [44, 92, 164, 212]) ctx.fillRect(x - 3, 14, 6, h - 28);
  ctx.fillStyle = "#555";
  for (const x of [44, 92, 164, 212]) ctx.fillRect(x - 8, h * 0.55, 16, 10);
  ctx.strokeStyle = "#7d7d7d";
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, w - 14, h - 14);
  return tex(c);
}

export function containerTopTexture() {
  const { c, ctx } = canvas(512, 112);
  ctx.fillStyle = "#e4e4e4";
  ctx.fillRect(0, 0, c.width, c.height);
  for (let x = 0; x < c.width; x += 10) {
    ctx.fillStyle = x % 20 === 0 ? "#f4f4f4" : "#cbcbcb";
    ctx.fillRect(x, 6, 5, c.height - 12);
  }
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, c.width, c.height);
  return tex(c);
}

export function hazardTexture() {
  const { c, ctx } = canvas(256, 64);
  ctx.fillStyle = "#f5b301";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#151515";
  for (let x = -64; x < c.width + 64; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x + 16 + 64, 64);
    ctx.lineTo(x + 64, 64);
    ctx.fill();
  }
  const t = tex(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Asphalt with lane markings. u runs across the road, v along it. */
export function roadTexture() {
  const { c, ctx } = canvas(256, 512);
  const r = rng(7);
  ctx.fillStyle = "#121314";
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2600; i++) {
    const v = 14 + r() * 22;
    ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
    ctx.fillRect(r() * c.width, r() * c.height, 1.5, 1.5);
  }
  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(14, 0, 5, c.height);
  ctx.fillRect(c.width - 19, 0, 5, c.height);
  ctx.fillStyle = "#cfcfcf";
  ctx.fillRect(c.width / 2 - 3, 40, 6, 200);
  ctx.fillRect(c.width / 2 - 3, 296, 6, 200);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function concreteTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(3);
  ctx.fillStyle = "#d9dadc";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 200 + r() * 30;
    ctx.fillStyle = `rgba(${v},${v},${v + 3},0.5)`;
    ctx.fillRect(r() * 512, r() * 512, 2, 2);
  }
  ctx.strokeStyle = "rgba(120,120,125,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Tileable normal map built from a sum of periodic waves. */
export function waterNormalTexture() {
  const N = 256;
  const h = new Float32Array(N * N);
  const r = rng(11);
  const waves = Array.from({ length: 14 }, () => ({
    kx: Math.round((r() - 0.5) * 18),
    ky: Math.round((r() - 0.5) * 18) || 1,
    p: r() * Math.PI * 2,
    a: 0.4 + r(),
  }));
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let v = 0;
      for (const w of waves) v += (w.a / Math.hypot(w.kx, w.ky)) * Math.sin(((w.kx * x + w.ky * y) / N) * Math.PI * 2 + w.p);
      h[y * N + x] = v;
    }
  const { c, ctx } = canvas(N, N);
  const img = ctx.createImageData(N, N);
  const s = 9;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
      const dy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
      let nx = -dx * s, ny = -dy * s, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const i = (y * N + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const t = tex(c, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Foam trail behind the ship: bright at the stern, frayed toward the tail. */
export function wakeTexture() {
  const { c, ctx } = canvas(512, 256);
  const r = rng(5);
  ctx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 2400; i++) {
    const t = r(); // 0 at stern (left) → 1 far behind
    const x = t * 512;
    const spread = 18 + t * 90;
    const side = r() < 0.5 ? -1 : 1;
    const y = 128 + side * (spread * (0.35 + r() * 0.65)) * (r() < 0.25 ? 0.3 : 1);
    const a = (1 - t) * (0.25 + r() * 0.5);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + r() * 14, 2 + r() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return tex(c);
}

export function decalTexture(text: string, color: string, bg = "transparent", w = 512, h = 128, weight = 900) {
  const { c, ctx } = canvas(w, h);
  if (bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = color;
  ctx.font = `${weight} ${Math.round(h * 0.7)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + h * 0.04);
  return tex(c);
}

/** Kraft cardboard with packing tape and a shipping label. */
export function parcelTexture() {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = "#c39462";
  ctx.fillRect(0, 0, 256, 256);
  const r = rng(21);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(90,60,30,${r() * 0.12})`;
    ctx.fillRect(r() * 256, r() * 256, 2, 1);
  }
  ctx.fillStyle = "rgba(236,214,170,0.85)";
  ctx.fillRect(0, 110, 256, 36);
  ctx.fillStyle = "#f4f4f2";
  ctx.fillRect(150, 160, 84, 64);
  ctx.fillStyle = "#1d55d6";
  ctx.fillRect(150, 160, 84, 14);
  ctx.fillStyle = "#222";
  for (let y = 184; y < 220; y += 8) ctx.fillRect(158, y, 40 + r() * 28, 3);
  return tex(c);
}

/** Soft cone falloff for headlight beams (alpha along the cone's v). */
export function beamTexture() {
  const { c, ctx } = canvas(8, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.7, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return tex(c, false);
}

/**
 * Skin + hair painted onto the courier's lathe skull. u runs around the head
 * (u = 0.25 is the face), v from chin (0) to crown (1). The hairline sits high
 * on the forehead, at the temples on the sides and low at the nape.
 */
export function headTexture(skin: string, hair: string) {
  const { c, ctx } = canvas(512, 256);
  const r = rng(31);
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = hair;
  const lines: number[] = [];
  for (let x = 0; x < 512; x++) {
    const u = x / 512;
    let a = Math.abs(u - 0.25); // angular distance from the face, as a fraction of a turn
    if (a > 0.5) a = 1 - a;
    const t = a / 0.5;
    const line = 0.7 - 0.37 * Math.pow(t, 1.15) - (t > 0.35 && t < 0.62 ? 0.04 : 0); // dip for the sideburn
    const yLine = (1 - line) * 256 + (r() - 0.5) * 2;
    lines.push(yLine);
    ctx.fillRect(x, 0, 1, yLine);
  }
  // soft, slightly ragged edge just along the hairline
  for (let i = 0; i < 1400; i++) {
    const x = Math.floor(r() * 512);
    ctx.fillStyle = `rgba(43,30,22,${0.2 + r() * 0.4})`;
    ctx.fillRect(x, lines[x] - 2 + r() * 4, 1, 1 + r() * 3);
  }
  return tex(c);
}
