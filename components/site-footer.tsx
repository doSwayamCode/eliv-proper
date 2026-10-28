import Link from "next/link";
import { FooterEmailField } from "@/components/footer-email-field";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const headingClass =
  "text-sm font-medium tracking-[0.16em] text-neutral-950 uppercase";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/8 bg-white text-neutral-950">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-14 sm:px-10 lg:px-14 lg:py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <p className="text-[clamp(2rem,3vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
              Eliv Logistics
            </p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">
              Freight forwarding, land transport, and customs brokerage, unified
              across APAC under one accountable team.
            </p>
            <p className={`mt-8 ${headingClass}`}>Newsletter</p>
            <FooterEmailField
              id="footer-email"
              placeholder="Enter your email"
              submitLabel="Subscribe"
              source="newsletter"
            />
          </div>

          <nav aria-label="Footer" className="lg:text-center">
            <p className={headingClass}>Links</p>
            <ul className="mt-5 flex flex-col gap-3">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-950 hover:text-zinc-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={headingClass}>Contact info</p>
            <ul className="mt-5 flex flex-col gap-4 text-sm leading-6 text-zinc-600">
              <li className="flex items-center gap-3">
                <PinIcon />
                <span>
                  2A International Square, Tullamarine VIC 3043, Australia.
                </span>
              </li>
              <li>
                <a href="tel:1300000082" className="flex items-center gap-3 hover:text-neutral-950">
                  <PhoneIcon />
                  <span>1300 000 082</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@unitedcarriers.com"
                  className="flex items-center gap-3 hover:text-neutral-950"
                >
                  <MailIcon />
                  <span>contact@unitedcarriers.com</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[clamp(2rem,3vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
              Book a call
            </p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">
              Still having questions? Request a call back.
            </p>
            <FooterEmailField
              id="footer-call"
              placeholder="Request a call"
              submitLabel="Request a call"
              source="book-a-call"
            />
            <div className="mt-8 flex items-center gap-3">
              <SocialLink
                label="LinkedIn"
                href="https://www.linkedin.com/company/united-carriers-apac/"
              >
                <LinkedInIcon />
              </SocialLink>
              <SocialLink label="Instagram" href="https://www.instagram.com">
                <InstagramIcon />
              </SocialLink>
              <SocialLink label="Facebook" href="https://www.facebook.com">
                <FacebookIcon />
              </SocialLink>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 text-xs tracking-wide text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Eliv Logistics. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-neutral-950"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-neutral-950"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-black/15 text-neutral-950 transition-colors hover:bg-black/5"
    >
      {children}
    </a>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 4h2l1.2 3.2-1.6 1a12 12 0 0 0 6.2 6.2l1-1.6L20 14v2a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4h2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden fill="currentColor">
      <path d="M4.7 3.3A1.8 1.8 0 1 0 4.7 7a1.8 1.8 0 0 0 0-3.7zM3.2 8.6h3v12.1h-3V8.6zm5.2 0h2.9v1.7h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7v7.3h-3v-6.5c0-1.5 0-3.5-2.1-3.5s-2.5 1.7-2.5 3.4v6.6h-3V8.6z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden fill="currentColor">
      <path d="M14.2 8.5V6.9c0-.7.5-1 1.2-1h1.4V3.2h-2.3c-2.5 0-3.9 1.5-3.9 3.9v1.4H8.6V11h2v9.8h3.6V11h2.3l.4-2.5h-2.7z" />
    </svg>
  );
}
