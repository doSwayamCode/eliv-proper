"use client";

import { useEffect, useRef } from "react";
import type { GlobePlace, GlobeRoute, ProjectedPlace } from "@/lib/globe/globe-scene";

const places: (GlobePlace & { name: string })[] = [
  { id: "sf", name: "San Francisco", lat: 37.78, lng: -122.44 },
  { id: "nyc", name: "New York", lat: 40.71, lng: -74.01 },
  { id: "london", name: "London", lat: 51.51, lng: -0.13 },
  { id: "tokyo", name: "Tokyo", lat: 35.68, lng: 139.65 },
  { id: "sydney", name: "Sydney", lat: -33.87, lng: 151.21 },
  { id: "singapore", name: "Singapore", lat: 1.35, lng: 103.82 },
  { id: "dubai", name: "Dubai", lat: 25.2, lng: 55.27 },
  { id: "saopaulo", name: "São Paulo", lat: -23.55, lng: -46.63 },
  { id: "capetown", name: "Cape Town", lat: -33.92, lng: 18.42 },
];

const routes: GlobeRoute[] = [
  { from: "sf", to: "tokyo" },
  { from: "nyc", to: "london" },
  { from: "london", to: "dubai" },
  { from: "dubai", to: "singapore" },
  { from: "singapore", to: "sydney" },
  { from: "tokyo", to: "sydney" },
  { from: "saopaulo", to: "capetown" },
  { from: "nyc", to: "saopaulo" },
  { from: "capetown", to: "dubai" },
  { from: "sf", to: "nyc" },
];

/** Auto-spin in radians per second. */
const SPIN = 0.07;

export function HomeGlobe() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labels = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const { GlobeScene } = await import("@/lib/globe/globe-scene");
      if (disposed) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const shown: Record<string, boolean> = {};
      // labels are positioned from the projected point every frame and fade out
      // as soon as their place turns past the visible face of the globe
      const onFrame = (projected: ProjectedPlace[]) => {
        for (const p of projected) {
          const el = labels.current[p.id];
          if (!el) continue;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, calc(-100% - 10px))`;
          if (shown[p.id] !== p.visible) {
            shown[p.id] = p.visible;
            el.toggleAttribute("data-visible", p.visible);
          }
        }
      };

      let globe: InstanceType<typeof GlobeScene>;
      try {
        globe = new GlobeScene(canvas, places, routes, { reducedMotion, onFrame });
      } catch {
        return; // no WebGL: the hero still reads fine without the globe
      }
      // start with APAC facing the viewer
      globe.phi = -2.35;

      const resize = () => globe.resize(wrap.clientWidth, wrap.clientHeight);
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      // drag to spin / tilt, with a little inertia on release
      let dragging = false;
      let lastX = 0, lastY = 0, velocity = 0;
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        velocity = 0;
        canvas.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = (e.clientX - lastX) / 260;
        globe.phi += dx;
        velocity = dx;
        globe.tilt = Math.min(1.1, Math.max(-0.6, globe.tilt + (e.clientY - lastY) / 320));
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onUp = () => (dragging = false);
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      // render only while the hero is on screen
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
      io.observe(wrap);

      let raf = 0;
      let last = performance.now();
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!dragging) {
          velocity *= Math.pow(0.03, dt);
          globe.phi += velocity + (reducedMotion ? 0 : SPIN * dt);
        }
        globe.render(now / 1000);
      };
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        globe.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto absolute top-1/2 right-[-18%] z-0 aspect-square w-[min(118vh,1280px)] -translate-y-[46%] sm:right-[-10%] lg:right-[-6%]"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        aria-label="Rotating globe of Eliv trade routes"
        role="img"
      />
      {places.map((place) => (
        <span
          key={place.id}
          ref={(node) => {
            labels.current[place.id] = node;
          }}
          className="globe-label pointer-events-none"
        >
          {place.name}
        </span>
      ))}
    </div>
  );
}
