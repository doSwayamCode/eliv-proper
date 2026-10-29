import Link from "next/link";
import { HomeGlobe } from "@/components/home-globe";

const news =
  "News: UC Courtside is here.   ·   China–Australia ocean freight: rates are moving higher.   ·   United Carriers named 2026 Local Business Awards finalists.   ·   ";

export function HomeHero() {
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden bg-black pt-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 8% 18%, rgba(255,255,255,0.7) 50%, transparent 51%), radial-gradient(1px 1px at 22% 42%, rgba(255,255,255,0.45) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 38% 12%, rgba(255,255,255,0.55) 50%, transparent 51%), radial-gradient(1px 1px at 54% 28%, rgba(255,255,255,0.4) 50%, transparent 51%), radial-gradient(1px 1px at 71% 8%, rgba(255,255,255,0.6) 50%, transparent 51%), radial-gradient(1px 1px at 86% 36%, rgba(255,255,255,0.35) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 14% 72%, rgba(255,255,255,0.4) 50%, transparent 51%), radial-gradient(1px 1px at 46% 64%, rgba(255,255,255,0.3) 50%, transparent 51%), radial-gradient(1px 1px at 63% 78%, rgba(255,255,255,0.45) 50%, transparent 51%), radial-gradient(1px 1px at 92% 62%, rgba(255,255,255,0.5) 50%, transparent 51%)",
        }}
      />

      <div className="relative z-20 overflow-hidden border-b border-white/10 py-2.5">
        <div className="footer-marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <p
              key={copy}
              className="pr-8 text-[10px] tracking-[0.18em] whitespace-nowrap text-white/55 uppercase"
            >
              {news}
            </p>
          ))}
        </div>
      </div>

      <HomeGlobe />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pt-10 pb-8 sm:px-10 lg:max-w-[46%] lg:px-16 lg:pb-10">
        <p className="text-[12px] font-medium tracking-[0.22em] text-white/70 uppercase">
          One operator
        </p>
        <h1 className="mt-4 text-[clamp(3.6rem,7vw,6.4rem)] leading-[0.84] font-bold tracking-[-0.045em] uppercase">
          Every
          <br />
          leg of the
          <br />
          journey
        </h1>
        <p className="mt-6 max-w-xs text-[14px] leading-6 text-white/75">
          Freight forwarding, land transport, and customs brokerage, unified
          across APAC under one accountable team.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-full bg-white px-6 text-[11px] font-semibold tracking-[0.16em] text-black uppercase"
          >
            Talk with us
          </Link>
          <Link
            href="/services"
            className="inline-flex h-11 items-center rounded-full border border-white/70 px-6 text-[11px] font-semibold tracking-[0.16em] uppercase"
          >
            Our services
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-6 border-t border-white/15 px-6 py-3 text-[10px] tracking-[0.18em] text-white/55 uppercase sm:px-10 lg:px-16">
        <p>Australia · New Zealand · Hong Kong · China</p>
        <p className="hidden sm:block">Drag the globe</p>
      </div>
    </section>
  );
}
