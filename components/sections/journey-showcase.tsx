"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Shipment clock, keyed to story time (s → minutes): dawn breaks as the film opens, dusk falls on the highway. */
const CLOCK: [number, number][] = [
  [0, 5 * 60 + 50],
  [5, 6 * 60 + 40],
  [69.5, 17 * 60 + 30],
  [81.5, 19 * 60 + 45],
  [118, 23 * 60 + 10],
];

function clockAt(t: number) {
  let m = CLOCK[CLOCK.length - 1][1];
  for (let i = 1; i < CLOCK.length; i++) {
    const [t0, m0] = CLOCK[i - 1];
    const [t1, m1] = CLOCK[i];
    if (t <= t1) {
      m = Math.floor(m0 + ((t - t0) / (t1 - t0)) * (m1 - m0));
      break;
    }
  }
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const CHAPTER_COPY = [
  {
    key: "pickup",
    eyebrow: "01 — Pickup",
    title: "Handed over at the door.",
    body: "Our courier loads your consignment straight into its container. From the first touch it is on one file, with one team.",
  },
  {
    key: "yard",
    eyebrow: "02 — The yard",
    title: "Picked with precision.",
    body: "Every box starts on our own hardstand: staged, checked and lifted by our team, not a subcontractor's.",
  },
  {
    key: "load",
    eyebrow: "03 — Load",
    title: "Loaded on the same file.",
    body: "Container, chassis and driver are booked together, so the handoff from yard to road is a lift, not a phone call.",
  },
  {
    key: "road",
    eyebrow: "04 — Road",
    title: "Every leg of the journey.",
    body: "Local, metro and interstate legs run on live tracking. You see the truck the way our dispatch team does.",
  },
  {
    key: "port",
    eyebrow: "05 — Port",
    title: "Quay to vessel, no gaps.",
    body: "Terminal slots, customs release and stevedoring are coordinated in-house, so your box makes the cut-off.",
  },
  {
    key: "sea",
    eyebrow: "06 — Sea",
    title: "Across APAC, tracked to the door.",
    body: "Australia, New Zealand, Hong Kong and China. One operator from the yard gate to the final mile.",
  },
];

/**
 * Scroll-scrubbed 3D logistics film: courier pickup → yard → reach stacker →
 * truck → road (day turns to night) → quay crane → vessel. The section is tall; its stage is `position: sticky`,
 * so there is no pin-spacer reflow and the browser composites it for free.
 */
export function JourneyShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dayScrimRef = useRef<HTMLDivElement>(null);
  const nightScrimRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [{ JourneyScene }, { buildTimeline, CHAPTERS }] = await Promise.all([
        import("@/lib/journey/scene"),
        import("@/lib/journey/timeline"),
      ]);
      if (disposed || !canvasRef.current || !sectionRef.current) return;

      let scene: InstanceType<typeof JourneyScene>;
      try {
        scene = new JourneyScene(canvasRef.current, { mobile: window.matchMedia("(max-width: 767px)").matches });
      } catch {
        setFailed(true);
        return;
      }
      const state = scene.initialState();
      const tl = buildTimeline(scene, state);
      const total = tl.duration();

      const stage = canvasRef.current.parentElement!;
      const resize = () => scene.resize(stage.clientWidth, stage.clientHeight);
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(stage);

      let target = 0;
      let current = 0;
      let visible = true;
      let activeChapter = -1;
      let isNight = false;
      let lastNight = -1;
      let debugOverride: Partial<typeof state> | null = null;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => (target = self.progress),
      });
      target = current = st.progress;

      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px 0px" });
      io.observe(sectionRef.current);

      const frame = (time: number, deltaMs: number) => {
        if (!visible) return;
        // while the section slides in under the black hero, a dark band hides the seam between them
        if (seamRef.current) {
          const top = sectionRef.current!.getBoundingClientRect().top;
          seamRef.current.style.opacity = String(Math.min(1, Math.max(0, top / window.innerHeight)) ** 0.6);
        }
        // critically-damped follow on top of Lenis: no jumps on wheel ticks or scrollbar drags
        const k = 1 - Math.exp(-(deltaMs / 1000) * 9);
        current += (target - current) * k;
        if (Math.abs(target - current) < 1e-5) current = target;
        tl.progress(current);
        if (debugOverride) Object.assign(state, debugOverride);
        const t = tl.time();
        scene.update(state, t);
        scene.tick(time);
        scene.render();

        // HUD — written straight to the DOM, no React renders per frame
        let ch = 0;
        for (let i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i].at) ch = i;
        if (ch !== activeChapter) {
          activeChapter = ch;
          chapterRefs.current.forEach((el, i) => el?.toggleAttribute("data-active", i === ch));
          railRefs.current.forEach((el, i) => {
            el?.toggleAttribute("data-active", i === ch);
            el?.toggleAttribute("data-done", i < ch);
          });
        }
        if (speedRef.current) speedRef.current.textContent = String(Math.min(99, Math.round(scene.speed))).padStart(2, "0");
        if (unitRef.current) unitRef.current.textContent = state.mode >= 4 ? "KN" : "KM/H";
        if (barRef.current) barRef.current.style.transform = `scaleX(${t / total})`;

        // the day passes, dawn to night, and the overlay follows the light
        if (clockRef.current) clockRef.current.textContent = clockAt(t);
        const n = state.night;
        if (Math.abs(n - lastNight) > 1e-3) {
          lastNight = n;
          if (dayScrimRef.current) dayScrimRef.current.style.opacity = String(1 - n);
          if (nightScrimRef.current) nightScrimRef.current.style.opacity = String(n);
          if (n > 0.5 !== isNight) {
            isNight = n > 0.5;
            stageRef.current?.toggleAttribute("data-night", isNight);
          }
        }
      };
      // `?journey-debug` freezes the loop and exposes a manual seek — used for visual QA screenshots
      const debug = new URLSearchParams(window.location.search).has("journey-debug");
      if (debug) {
        // optional override pins state fields (e.g. a close-up camera) for inspection
        (window as unknown as { __journeySeek?: (p: number, o?: Partial<typeof state>) => void }).__journeySeek = (p, o) => {
          debugOverride = o ?? null;
          target = current = p;
          visible = true;
          frame(gsap.ticker.time, 16);
        };
      } else gsap.ticker.add(frame);
      frame(gsap.ticker.time, 1000);
      setReady(true);

      cleanup = () => {
        gsap.ticker.remove(frame);
        st.kill();
        io.disconnect();
        ro.disconnect();
        tl.kill();
        scene.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <section ref={sectionRef} id="journey" aria-label="From yard to vessel" className="relative h-[1450vh] bg-[#070d1b] md:h-[1700vh]">
      {/* opens before dawn, so it continues the dark hero instead of cutting to a bright stage */}
      <div ref={stageRef} data-night="" className="journey-stage sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          aria-hidden
        />
        {failed && (
          <div className="absolute inset-0 bg-[#0d0e12]" aria-hidden />
        )}

        {/* soft scrim keeps copy legible over the 3D stage */}
        <div ref={dayScrimRef} style={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(to_top,rgba(238,240,243,0.95)_0%,rgba(238,240,243,0.6)_30%,transparent_55%)] md:bg-[linear-gradient(to_right,rgba(238,240,243,0.92)_0%,rgba(238,240,243,0.55)_30%,transparent_48%)]" />
        <div ref={nightScrimRef} style={{ opacity: 1 }} className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(to_top,rgba(7,13,27,0.92)_0%,rgba(7,13,27,0.55)_30%,transparent_55%)] md:bg-[linear-gradient(to_right,rgba(7,13,27,0.85)_0%,rgba(7,13,27,0.45)_30%,transparent_48%)]" />

        {/* chapter copy */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-24 sm:px-8 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-[44vw] md:max-w-[560px] md:items-center md:pb-0 md:pl-12">
          <div className="relative h-[190px] w-full md:h-[260px]">
            {CHAPTER_COPY.map((c, i) => (
              <div
                key={c.key}
                ref={(el) => {
                  chapterRefs.current[i] = el;
                }}
                className="journey-chapter absolute inset-0"
              >
                <p className="j-muted font-mono text-[11px] tracking-[0.22em] uppercase">{c.eyebrow}</p>
                <h3 className="mt-3 text-[34px] leading-[0.98] font-semibold tracking-[-0.03em] j-ink sm:text-5xl md:text-[58px]">
                  {c.title}
                </h3>
                <p className="mt-4 max-w-[400px] text-[14px] leading-relaxed j-body md:text-[15px]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* speedometer, like a dash readout */}
        <div className="j-muted pointer-events-none absolute top-24 left-5 z-10 font-mono text-[11px] tracking-[0.2em] sm:left-8 md:left-12">
          <span ref={clockRef} className="j-ink tabular-nums">05:50</span>
          <span className="mx-2 opacity-50">·</span>
          <span ref={speedRef} className="j-ink tabular-nums">00</span> <span ref={unitRef}>KM/H</span>
        </div>

        {/* chapter rail */}
        <ol className="pointer-events-none absolute top-24 right-5 z-10 hidden flex-col items-end gap-3 font-mono text-[10px] tracking-[0.22em] uppercase sm:right-8 md:flex md:right-12">
          {CHAPTER_COPY.map((c, i) => (
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

        <div ref={seamRef} className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[38vh] bg-gradient-to-b from-black via-black/60 to-transparent" aria-hidden />

        <div className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-black/5">
          <div ref={barRef} className="h-full origin-left bg-[#1d55d6]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
