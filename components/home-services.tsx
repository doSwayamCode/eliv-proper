"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Reveal } from "@/components/motion/reveal";

const services = [
  {
    title: "Air freight",
    body: "Express, priority, and deferred options across global trade lanes — managed end to end for speed and schedule integrity.",
    image: "/home-services/aircraft.jpg",
  },
  {
    title: "Ocean freight",
    body: "FCL, LCL, and specialised cargo movements, with structured carrier selection and routing for cost and reliability.",
    image: "/home-services/ship.jpg",
  },
  {
    title: "Customs brokerage",
    body: "In-house licensed brokerage covering classification, compliance, and quarantine — full control, no outsourcing.",
    image: "/home-services/office.jpg",
  },
  {
    title: "Warehousing and 3PL",
    body: "Scalable storage, pick and pack, and distribution — fully integrated with freight and transport operations.",
    image: "/home-services/warehouse.jpg",
  },
  {
    title: "Project cargo",
    body: "Specialist handling for oversized and complex shipments — from permits to engineered load configurations.",
    image: "/home-services/cranes.jpg",
  },
  {
    title: "Domestic & interstate transport",
    body: "Local, metro, and interstate transport managed for consistent service levels and full delivery visibility.",
    image: "/home-services/truck.jpg",
  },
];

/** Service index with a cursor-following preview image on hover (desktop). */
export function HomeServices() {
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0 });

  const onMove = (e: React.MouseEvent) => {
    const p = pos.current;
    const r = e.currentTarget.getBoundingClientRect();
    p.tx = e.clientX - r.left;
    p.ty = e.clientY - r.top;
    if (!p.raf) {
      const loop = () => {
        p.x += (p.tx - p.x) * 0.16;
        p.y += (p.ty - p.y) * 0.16;
        if (preview.current) preview.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
        p.raf = Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) > 0.5 ? requestAnimationFrame(loop) : 0;
      };
      p.raf = requestAnimationFrame(loop);
    }
  };

  return (
    <section className="bg-white px-5 py-24 text-neutral-950 sm:px-8 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <h2 className="text-4xl leading-[0.95] font-semibold tracking-[-0.045em] uppercase md:text-6xl">
            Everything your freight needs. <span className="text-neutral-400">Under one group.</span>
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
            <p>From air to sea, from customs clearance to final delivery, we bring decades of expertise across every freight discipline.</p>
            <p>Our integrated service network means one partner, one point of contact, and total visibility from origin to destination.</p>
          </div>
        </div>

        <div className="relative mt-16" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
          <div
            ref={preview}
            className={`pointer-events-none absolute top-0 left-0 z-10 hidden aspect-[4/3] w-72 overflow-hidden rounded-lg shadow-2xl transition-[opacity,scale] duration-500 md:block ${active === null ? "scale-90 opacity-0" : "scale-100 opacity-100"}`}
          >
            {services.map((s, i) => (
              <Image key={s.title} src={s.image} alt="" fill sizes="288px" className={`object-cover transition-opacity duration-500 ${active === i ? "opacity-100" : "opacity-0"}`} />
            ))}
          </div>
          <ul className="border-t border-neutral-200">
            {services.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 60}>
                <Link
                  href="/services"
                  onMouseEnter={() => setActive(i)}
                  className="group grid grid-cols-[40px_1fr] gap-x-4 gap-y-2 border-b border-neutral-200 py-7 transition-colors md:grid-cols-[60px_1fr_1.3fr_40px] md:items-center"
                >
                  <span className="font-mono text-[11px] text-neutral-400">0{i + 1}</span>
                  <span className="text-lg font-semibold tracking-tight uppercase transition-transform duration-500 group-hover:translate-x-2 md:text-2xl">{s.title}</span>
                  <span className="col-start-2 text-sm leading-relaxed text-neutral-500 md:col-start-auto">{s.body}</span>
                  <span className="hidden justify-self-end text-neutral-300 transition-all duration-500 group-hover:-rotate-45 group-hover:text-black md:block">→</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>

        <Link
          href="/services"
          className="mt-10 inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
        >
          Our services
        </Link>
      </div>
    </section>
  );
}
