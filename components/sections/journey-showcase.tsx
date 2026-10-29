"use client";

import { useEffect, useRef, useState } from "react";

/** Frame sequences built by scripts/build-journey-film.mjs (10 fps of the 32.5 s stock-footage edit). */
const FRAME_COUNT = 325;
const FPS = 10;
const FRAME_SIZE = { d: [1600, 900], m: [960, 540] } as const;
const frameSrc = (set: "d" | "m", i: number) => `/journey/${set}/${String(i).padStart(3, "0")}.avif`;
/** shown, still, in browsers that cannot decode the AVIF frames */
const POSTER = "/journey/poster.jpg";

/** `at` is the edit time (s) the chapter starts; `focus` is the horizontal subject position for cover-cropping. */
const CHAPTERS = [
  {
    key: "pickup",
    at: 0,
    focus: 0.62,
    status: "Picked up",
    eyebrow: "01 — Pickup",
    title: "Handed over at the door.",
    body: "Our courier collects your consignment and loads it for the depot. From the first touch it is on one file, with one team.",
  },
  {
    key: "depot",
    at: 10.3,
    focus: 0.66,
    status: "Checked in",
    eyebrow: "02 — Depot",
    title: "Checked in, counted out.",
    body: "Every carton is received, counted and booked against your consignment by our own people, not a subcontractor's.",
  },
  {
    key: "road",
    at: 13.6,
    focus: 0.5,
    status: "In transit",
    eyebrow: "03 — Road",
    title: "Every leg of the journey.",
    body: "Local, metro and interstate legs run on live tracking. You see the truck the way our dispatch team does.",
  },
  {
    key: "port",
    at: 20.45,
    focus: 0.5,
    status: "At terminal",
    eyebrow: "04 — Port",
    title: "Quay to vessel, no gaps.",
    body: "Terminal slots, customs release and stevedoring are coordinated in-house, so your box makes the vessel cut-off.",
  },
  {
    key: "sea",
    at: 27.47,
    focus: 0.5,
    status: "Loaded aboard",
    eyebrow: "05 — Sea",
    title: "Across APAC, tracked to the door.",
    body: "Australia, New Zealand, Hong Kong and China. One operator from the depot gate to the final mile.",
  },
];

/** Shipment clock (minutes) across the film: a working day from first pickup to vessel cut-off. */
const CLOCK_START = 7 * 60 + 50;
const CLOCK_END = 17 * 60 + 40;
const FILM_LENGTH = (FRAME_COUNT - 1) / FPS;

function clockAt(t: number) {
  const m = Math.floor(CLOCK_START + (t / FILM_LENGTH) * (CLOCK_END - CLOCK_START));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Coarse-to-fine load order (every 16th frame, then 8th, …) so scrubbing works before the set is complete. */
function loadOrder() {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const stride of [16, 8, 4, 2, 1])
    for (let i = 0; i < FRAME_COUNT; i += stride)
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
  if (!seen.has(FRAME_COUNT - 1)) order.splice(1, 0, FRAME_COUNT - 1);
  return order;
}

/**
 * Scroll-scrubbed live-action film: courier pickup → depot check → road →
 * port → vessel. Frames are drawn to a canvas
 * from a pre-decoded image sequence, which stays smooth where seeking a <video> stutters.
 * The section is tall and its stage is `position: sticky`, so nothing is pinned or reflowed.
 */
export function JourneyShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!section || !canvas || !ctx) return;

    const set = window.matchMedia("(max-width: 767px)").matches ? "m" : "d";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    let disposed = false;
    let loading = false;

    let target = 0;
    let current = 0;
    let drawn = -1;
    let dirty = true;
    let activeChapter = -1;
    let raf = 0;
    let last = 0;
    let visible = false;

    const decode = async (src: string) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      await img.decode();
      return img;
    };

    const load = async () => {
      if (loading) return;
      loading = true;
      // the first frame doubles as the AVIF support check; without it the stage holds the poster
      try {
        frames[0] = await decode(frameSrc(set, 0));
      } catch {
        try {
          frames[0] = await decode(POSTER);
        } catch {
          return;
        }
        if (!disposed) {
          setReady(true);
          dirty = true;
          kick();
        }
        return;
      }
      if (disposed) return;
      setReady(true);
      dirty = true;
      kick();
      const queue = loadOrder().filter((i) => i !== 0);
      const worker = async () => {
        while (queue.length && !disposed) {
          const i = queue.shift()!;
          let img: HTMLImageElement;
          try {
            img = await decode(frameSrc(set, i));
          } catch {
            continue;
          }
          if (disposed) return;
          frames[i] = img;
          dirty = true;
          kick();
        }
      };
      for (let w = 0; w < 6; w++) void worker();
    };

    const resize = () => {
      // no point drawing more pixels than the frames have: cap the backing store at source resolution
      const [sw, sh] = FRAME_SIZE[set];
      const cover = Math.max(canvas.clientWidth / sw, canvas.clientHeight / sh);
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, 1 / cover));
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        dirty = true;
        kick();
      }
    };

    const readScroll = () => {
      const r = section.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      target = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      kick();
    };

    /** nearest frame that has loaded, searching outward from the wanted one */
    const nearest = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const draw = (i: number, focus: number) => {
      const img = frames[i]!;
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      const x = Math.min(0, Math.max(cw - w, cw / 2 - w * focus));
      ctx.drawImage(img, x, (ch - h) / 2, w, h);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(now - last, 100) : 16;
      last = now;
      // critically-damped follow: wheel ticks and scrollbar drags glide instead of jumping
      current = reduceMotion ? target : current + (target - current) * (1 - Math.exp(-(dt / 1000) * 10));
      if (Math.abs(target - current) < 1e-4) current = target;

      const t = current * ((FRAME_COUNT - 1) / FPS);
      let chIdx = 0;
      for (let i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i].at) chIdx = i;

      const want = Math.round(current * (FRAME_COUNT - 1));
      const i = nearest(want);
      if (i >= 0 && (i !== drawn || dirty)) {
        draw(i, CHAPTERS[chIdx].focus);
        drawn = i;
        dirty = false;
      }

      // HUD — written straight to the DOM, no React renders per frame
      if (chIdx !== activeChapter) {
        activeChapter = chIdx;
        chapterRefs.current.forEach((el, k) => el?.toggleAttribute("data-active", k === chIdx));
        railRefs.current.forEach((el, k) => {
          el?.toggleAttribute("data-active", k === chIdx);
          el?.toggleAttribute("data-done", k < chIdx);
        });
        if (statusRef.current) statusRef.current.textContent = CHAPTERS[chIdx].status;
      }
      if (clockRef.current) clockRef.current.textContent = clockAt(t);
      if (barRef.current) barRef.current.style.transform = `scaleX(${current})`;

      // keep gliding until settled; a frame that is still loading redraws via load()
      if (current !== target) kick();
      else last = 0;
    };

    function kick() {
      if (!raf && !disposed && visible) raf = requestAnimationFrame(frame);
    }

    // start fetching well before the section arrives, but never ahead of the hero's own assets
    const whenIdle = () => {
      const start = () => void load();
      const go = () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300));
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };
    const near = new IntersectionObserver(([e]) => e.isIntersecting && whenIdle(), { rootMargin: "150% 0px" });
    const onScreen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) readScroll();
    });
    near.observe(section);
    onScreen.observe(section);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("scroll", readScroll, { passive: true });
    readScroll();
    current = target;

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      near.disconnect();
      onScreen.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", readScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} id="journey" aria-label="From depot to vessel" className="relative h-[900vh] bg-[#07090d] md:h-[1050vh]">
      <div className="journey-stage sticky top-0 h-[100svh] w-full overflow-hidden text-white">
        <div className="absolute inset-x-0 top-0 h-[62%] md:inset-0 md:h-full">
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          />
          {/* scrims keep the copy legible over live footage */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#07090d_0%,rgba(7,9,13,0.4)_22%,transparent_45%)] md:bg-[linear-gradient(to_right,rgba(7,9,13,0.88)_0%,rgba(7,9,13,0.55)_28%,transparent_52%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
        </div>

        {/* chapter copy */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-16 sm:px-8 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-[44vw] md:max-w-[560px] md:items-center md:pb-0 md:pl-12">
          <div className="relative h-[230px] w-full md:h-[270px]">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.key}
                ref={(el) => {
                  chapterRefs.current[i] = el;
                }}
                className="journey-chapter absolute inset-0"
              >
                <p className="font-mono text-[11px] tracking-[0.22em] text-white/60 uppercase">{c.eyebrow}</p>
                <h3 className="mt-3 text-[32px] leading-[0.98] font-semibold tracking-[-0.03em] sm:text-5xl md:text-[56px]">{c.title}</h3>
                <p className="mt-4 max-w-[400px] text-[14px] leading-relaxed text-white/75 md:text-[15px]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* shipment readout */}
        <div className="pointer-events-none absolute top-24 left-5 z-10 font-mono text-[11px] tracking-[0.2em] text-white/60 uppercase sm:left-8 md:left-12">
          <span ref={clockRef} className="text-white tabular-nums">07:50</span>
          <span className="mx-2 opacity-50">·</span>
          <span ref={statusRef} className="text-white">{CHAPTERS[0].status}</span>
        </div>

        {/* chapter rail */}
        <ol className="pointer-events-none absolute top-24 right-5 z-10 hidden flex-col items-end gap-3 font-mono text-[10px] tracking-[0.22em] uppercase sm:right-8 md:right-12 md:flex">
          {CHAPTERS.map((c, i) => (
            <li
              key={c.key}
              ref={(el) => {
                railRefs.current[i] = el;
              }}
              className="journey-rail flex items-center gap-3"
            >
              {c.eyebrow.split(" — ")[1]}
              <span className="block h-px w-6 bg-current" />
            </li>
          ))}
        </ol>

        <div className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-white/10">
          <div ref={barRef} className="h-full origin-left bg-[#1d55d6]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
