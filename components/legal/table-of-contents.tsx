"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  title: string;
  number: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  currentPath: "/privacy-policy" | "/terms";
  contactEmail: string;
}

export function TableOfContents({
  items,
  currentPath,
  contactEmail,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (let i = items.length - 1; i >= 0; i--) {
        const element = document.getElementById(items[i].id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            setActiveId(items[i].id);
            return;
          }
        }
      }

      if (items.length > 0 && window.scrollY < 200) {
        setActiveId(items[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -110;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
      setMobileOpen(false);
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const activeItem = items.find((item) => item.id === activeId) || items[0];

  return (
    <>
      {/* Mobile Sticky Bar & Dropdown */}
      <div className="lg:hidden sticky top-16 z-30 mb-8 border-y border-black/10 bg-white/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-toc-list"
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white">
              {activeItem?.number}
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                Jump to section
              </span>
              <span className="block truncate text-sm font-semibold text-neutral-950">
                {activeItem?.title}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-black/10 bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
            <span>{mobileOpen ? "Close" : "Contents"}</span>
            <svg
              className={`size-3.5 transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {mobileOpen && (
          <nav
            id="mobile-toc-list"
            aria-label="Table of contents"
            className="mt-3 max-h-[60vh] overflow-y-auto rounded-xl border border-black/10 bg-neutral-50 p-2 divide-y divide-black/5 shadow-lg"
          >
            <div className="grid grid-cols-2 gap-2 p-1.5 mb-2 rounded-lg bg-neutral-200/60 text-xs font-semibold">
              <Link
                href="/privacy-policy"
                className={`rounded-md py-1.5 text-center transition-colors ${currentPath === "/privacy-policy"
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-950"
                  }`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className={`rounded-md py-1.5 text-center transition-colors ${currentPath === "/terms"
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-950"
                  }`}
              >
                Terms &amp; Conditions
              </Link>
            </div>

            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`flex items-baseline gap-3 px-3 py-2.5 text-xs transition-colors ${isActive
                      ? "bg-white font-bold text-neutral-950 shadow-xs rounded-lg"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-black/5 rounded-lg"
                    }`}
                >
                  <span className="font-mono text-neutral-400 text-[11px] w-5 shrink-0">
                    {item.number}.
                  </span>
                  <span className="truncate">{item.title}</span>
                </a>
              );
            })}
          </nav>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-6">
          {/* Policy Switcher */}
          <div className="rounded-2xl border border-black/8 bg-[#fbfbfa] p-2 shadow-xs">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-200/60 p-1 text-xs font-semibold">
              <Link
                href="/privacy-policy"
                className={`rounded-lg py-2 text-center transition-colors ${currentPath === "/privacy-policy"
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-950"
                  }`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className={`rounded-lg py-2 text-center transition-colors ${currentPath === "/terms"
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-950"
                  }`}
              >
                Terms
              </Link>
            </div>
          </div>

          {/* Table of Contents */}
          <nav
            aria-label="Table of contents"
            className="rounded-2xl border border-black/8 bg-[#fbfbfa] p-5 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/8">
              <p className="text-[11px] font-bold tracking-[0.18em] text-neutral-900 uppercase">
                Table of Contents
              </p>
              <span className="text-[11px] font-medium text-neutral-500">
                {items.length} sections
              </span>
            </div>

            <ol className="mt-4 max-h-[calc(100vh-22rem)] space-y-1 overflow-y-auto pr-1 text-xs">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => scrollToSection(e, item.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={`group flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 transition-all ${isActive
                          ? "bg-neutral-900 font-semibold text-white shadow-xs"
                          : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-950"
                        }`}
                    >
                      <span
                        className={`text-[11px] font-mono shrink-0 pt-0.5 ${isActive ? "text-neutral-400" : "text-neutral-400 group-hover:text-neutral-600"
                          }`}
                      >
                        {String(item.number).padStart(2, "0")}
                      </span>
                      <span className="leading-snug">{item.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Quick Contact Card */}
            <div className="rounded-2xl border border-black/8 bg-white p-5 text-xs text-neutral-800 shadow-xs">
              <p className="font-bold text-neutral-950">Questions or inquiries?</p>
              <p className="mt-1 text-neutral-600 leading-relaxed">
                Reach our legal &amp; compliance desk:
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="mt-3 inline-flex items-center gap-1.5 font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="size-3.5"
                >
                  <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
                <span>{contactEmail}</span>
              </a>
            </div>
          </div>
      </aside>
    </>
  );
}
