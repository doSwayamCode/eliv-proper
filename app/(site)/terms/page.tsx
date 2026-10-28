import type { Metadata } from "next";
import { TableOfContents, type TocItem } from "@/components/legal/table-of-contents";
import { LegalPlaceholder } from "@/components/legal/legal-placeholder";
import { PrintButton } from "@/components/legal/print-button";

export const metadata: Metadata = {
  title: "Terms & Conditions | E-Liv Logistics",
  description:
    "E-Liv Logistics Terms & Conditions of Website Use and Service. Governing freight forwarding, cargo liability, customer responsibilities, claims procedure, dispute resolution, and website terms.",
};

const tocItems: TocItem[] = [
  { id: "acceptance", title: "Acceptance", number: 1 },
  { id: "our-role", title: "Our role", number: 2 },
  { id: "quotes", title: "Quotes", number: 3 },
  { id: "customer-responsibilities", title: "Customer responsibilities", number: 4 },
  { id: "cargo-liability", title: "Cargo liability", number: 5 },
  { id: "claims-procedure", title: "Claims procedure", number: 6 },
  { id: "payment", title: "Payment", number: 7 },
  { id: "customs", title: "Customs", number: 8 },
  { id: "tracking-information", title: "Tracking information", number: 9 },
  { id: "website-use", title: "Website use", number: 10 },
  { id: "indemnity", title: "Indemnity", number: 11 },
  { id: "dispute-resolution", title: "Dispute resolution", number: 12 },
  { id: "general", title: "General", number: 13 },
  { id: "contact", title: "Contact", number: 14 },
];

export default function TermsPage() {
  return (
        <div className="bg-white text-neutral-900 min-h-screen">
          <div className="mx-auto w-full max-w-[1440px] px-6 pt-24 pb-20 sm:px-10 sm:pt-28 lg:px-14 lg:pt-32">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] lg:gap-14 xl:gap-16">
              {/* Left side: Sticky Table of Contents */}
              <TableOfContents
                items={tocItems}
                currentPath="/terms"
                contactEmail="legal@elivlogistics.com"
              />

              {/* Right side: Main content with main heading */}
              <main className="min-w-0">
                {/* Main Heading Header */}
                <header className="border-b border-black/10 pb-8 mb-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 font-semibold uppercase tracking-wider text-neutral-600 text-[10px]">
                        Legal &amp; Compliance
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-neutral-500 font-medium">
                        Effective date: <LegalPlaceholder>[DD Month 2026]</LegalPlaceholder>
                      </span>
                    </div>
                    <PrintButton />
                  </div>

                  <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                    E-Liv Logistics — Terms &amp; Conditions of Website Use and Service
                  </h1>
                </header>

                {/* Document Body */}
                <article className="prose prose-neutral max-w-none space-y-12 text-[15px] sm:text-base leading-relaxed text-neutral-700">

                  {/* 1. Acceptance */}
                  <section id="acceptance" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        1
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Acceptance
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        By using{" "}
                        <a
                          href="http://www.elivlogistics.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                        >
                          www.elivlogistics.com
                        </a>
                        , requesting a quote, or tendering cargo, you (&quot;Customer&quot;) accept these Terms. If you act for a company, you confirm you are authorised to bind it. A signed service agreement prevails over these Terms where they conflict.
                      </p>
                    </div>
                  </section>

                  {/* 2. Our role */}
                  <section id="our-role" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        2
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Our role
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        E-Liv Logistics acts as a freight forwarder, transportation broker and logistics coordinator. Unless we expressly agree in writing to act as carrier, we do not own or operate the trucks, vessels or aircraft that move your cargo; we arrange carriage with independent carriers, warehouses and agents as your agent.
                      </p>
                      <p>
                        <LegalPlaceholder>[FMCSA MC No. ____; USDOT No. ____; FMC OTI No. ____, if applicable.]</LegalPlaceholder>
                      </p>
                    </div>
                  </section>

                  {/* 3. Quotes */}
                  <section id="quotes" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        3
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Quotes
                      </h2>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ul className="list-disc space-y-2.5 pl-6 marker:text-neutral-500">
                        <li>
                          Quotes are based on the information you provide (commodity, weight, dimensions, pieces, origin, destination, dates).
                        </li>
                        <li>
                          Quotes are valid for <LegalPlaceholder>[7]</LegalPlaceholder> calendar days for road freight and <LegalPlaceholder>[the period shown on the quote]</LegalPlaceholder> for ocean and air, which follow carrier rate validity.
                        </li>
                        <li>
                          Quotes exclude duties, taxes, customs examination fees, detention, demurrage, storage, re-delivery, layover, lumper, liftgate, inside delivery, overweight permits and accessorials unless listed.
                        </li>
                        <li>
                          Fuel surcharges, carrier general rate increases and currency changes after acceptance may be passed through at cost.
                        </li>
                        <li>
                          A quote is not a booking until we confirm it in writing.
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* 4. Customer responsibilities */}
                  <section id="customer-responsibilities" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Customer responsibilities
                      </h2>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ul className="list-disc space-y-2.5 pl-6 marker:text-neutral-500">
                        <li>
                          Provide accurate, complete descriptions, weights, dimensions, values, HS codes and country of origin.
                        </li>
                        <li>
                          Supply commercial invoices, packing lists, certificates, licences and any permits required by law.
                        </li>
                        <li>
                          Package, label, mark and secure cargo for the intended mode of transport.
                        </li>
                        <li>
                          Declare hazardous materials and dangerous goods in writing before booking, classified, packed, marked and documented under 49 CFR (U.S.), the TDG Regulations (Canada), the IMDG Code (ocean) or IATA DGR (air). Undeclared dangerous goods may be refused, removed or destroyed at your cost.
                        </li>
                        <li>
                          Not tender prohibited, illegal, sanctioned or export-controlled goods without the required authorisation.
                        </li>
                        <li>
                          Pay all charges incurred because information was inaccurate or incomplete, including fines and penalties.
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* 5. Cargo liability */}
                  <section id="cargo-liability" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        5
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Cargo liability
                      </h2>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ul className="list-disc space-y-2.5 pl-6 marker:text-neutral-500">
                        <li>
                          Loss, damage or delay claims lie first against the carrier responsible, under its bill of lading, tariff and the governing regime: for U.S. interstate motor carriage, 49 U.S.C. §14706 (Carmack Amendment) subject to released rates; for ocean, the U.S. Carriage of Goods by Sea Act (US$500 per package or customary freight unit) or Hague-Visby rules; for international air, the Montreal Convention per-kilogram limit; for Canadian road freight, applicable federal and provincial uniform bill-of-lading limits. We will assist you in filing and pursuing such claims.
                        </li>
                        <li>
                          Our own liability, where we are negligent in arranging services, is limited to the lesser of actual loss or <LegalPlaceholder>[US$50 per shipment or transaction]</LegalPlaceholder>, unless you request and pay for excess-value coverage in writing before shipment.
                        </li>
                        <li>
                          We offer optional cargo insurance through third-party insurers on request; carrier liability is not insurance.
                        </li>
                        <li>
                          We are not liable for indirect, special or consequential loss, including lost profits, market loss, or production stoppage.
                        </li>
                        <li>
                          We are not liable for delays or failures caused by force majeure, including weather, natural disasters, port congestion, strikes, embargoes, government action, cyber-attacks, pandemics, or war.
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* 6. Claims procedure */}
                  <section id="claims-procedure" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        6
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Claims procedure
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Notify us in writing of visible loss or damage on the delivery receipt, and of concealed damage within <LegalPlaceholder>[5]</LegalPlaceholder> days of delivery. Submit formal claims with supporting documents within <LegalPlaceholder>[9 months]</LegalPlaceholder> of delivery (or the shorter period in the carrier contract). Freight charges may not be deducted from claim amounts.
                      </p>
                    </div>
                  </section>

                  {/* 7. Payment */}
                  <section id="payment" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        7
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Payment
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Charges are due per agreed credit terms, normally <LegalPlaceholder>[Net 15 / Net 30]</LegalPlaceholder> from invoice date, in <LegalPlaceholder>[USD]</LegalPlaceholder>. Overdue amounts accrue interest at <LegalPlaceholder>[1.5%]</LegalPlaceholder> per month or the maximum allowed by law. We hold a general lien on goods in our possession for all sums owed and may sell them after notice if unpaid.
                      </p>
                    </div>
                  </section>

                  {/* 8. Customs */}
                  <section id="customs" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        8
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Customs
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Where we coordinate customs entries, we act through a licensed customs broker as your agent under your power of attorney. You remain the importer of record and are responsible for the accuracy of declarations, duties and taxes.
                      </p>
                    </div>
                  </section>

                  {/* 9. Tracking information */}
                  <section id="tracking-information" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        9
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Tracking information
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Tracking data comes from carriers and partners and is provided &quot;as is&quot;; we do not guarantee its accuracy or timeliness.
                      </p>
                    </div>
                  </section>

                  {/* 10. Website use */}
                  <section id="website-use" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        10
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Website use
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        You may not: copy or scrape Site content; submit false quote requests; introduce malware; attempt unauthorised access; or use the Site to infringe others&apos; rights. All Site content, logos and trademarks belong to E-Liv Logistics or its licensors. The Site is provided &quot;as is&quot; without warranties; to the extent allowed by law, we are not liable for losses from Site use or third-party links.
                      </p>
                    </div>
                  </section>

                  {/* 11. Indemnity */}
                  <section id="indemnity" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        11
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Indemnity
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        You will indemnify us against claims, fines and costs arising from your breach of these Terms, inaccurate information, or undeclared hazardous or prohibited goods.
                      </p>
                    </div>
                  </section>

                  {/* 12. Dispute resolution */}
                  <section id="dispute-resolution" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        12
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Dispute resolution
                      </h2>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ul className="list-disc space-y-2.5 pl-6 marker:text-neutral-500">
                        <li>
                          Parties will first try to resolve disputes through good-faith negotiation for 30 days after written notice.
                        </li>
                        <li>
                          Unresolved disputes go to binding arbitration under <LegalPlaceholder>[the AAA Commercial Rules / ICC Rules]</LegalPlaceholder> seated in <LegalPlaceholder>[city]</LegalPlaceholder>, in English, by one arbitrator.
                        </li>
                        <li>
                          Either party may seek urgent injunctive relief in court.
                        </li>
                        <li>
                          These Terms are governed by the laws of <LegalPlaceholder>[State of ___, USA]</LegalPlaceholder>, excluding its conflict-of-law rules, unless mandatory law requires otherwise.
                        </li>
                        <li>
                          Any lawsuit against us must be started within <LegalPlaceholder>[1 year]</LegalPlaceholder> of the cause of action.
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* 13. General */}
                  <section id="general" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        13
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        General
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        If any clause is unenforceable, the rest stays in force. We may update these Terms by posting a new version; changes apply to shipments tendered after the update. No waiver is effective unless in writing.
                      </p>
                    </div>
                  </section>

                  {/* 14. Contact */}
                  <section id="contact" className="scroll-mt-28">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        14
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Contact
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p className="rounded-xl border border-black/8 bg-[#fbfbfa] p-5">
                        <LegalPlaceholder>[Entity name]</LegalPlaceholder>, <LegalPlaceholder>[address]</LegalPlaceholder> ·{" "}
                        <LegalPlaceholder>
                          [<a
                            href="mailto:legal@elivlogistics.com"
                            className="underline decoration-neutral-400 hover:decoration-neutral-950"
                          >
                            legal@elivlogistics.com
                          </a>]
                        </LegalPlaceholder> · <LegalPlaceholder>[phone]</LegalPlaceholder>
                      </p>
                    </div>
                  </section>

                </article>
              </main>
            </div>
          </div>
        </div>
        );
}
