"use client";

import { usePathname } from "next/navigation";
import { ConsultingCall } from "@/components/consulting-call";
import { FaqSection } from "@/components/faq-section";
import { IndustryMoving } from "@/components/industry-moving";
// import { MoveSmarter } from "@/components/move-smarter";

export function SiteAfterMain() {
  const pathname = usePathname();
  const isContact = pathname === "/contact" || pathname.startsWith("/contact/");
  const isIndustries =
    pathname === "/industries" || pathname.startsWith("/industries/");
  const isCareers = pathname === "/careers" || pathname.startsWith("/careers/");
  const isHome = pathname === "/";
  const isLegal =
    pathname === "/privacy-policy" ||
    pathname.startsWith("/privacy-policy/") ||
    pathname === "/terms" ||
  pathname.startsWith("/terms/");

  if (isIndustries || isCareers || isLegal) return null;

  return (
    <>
      {isContact ? null : <IndustryMoving />}
      {isHome ? <ConsultingCall /> : null}
      {isHome ? null : <FaqSection />}
      {/* {isContact ? null : <MoveSmarter />} */}
    </>
  );
}
