import type { Metadata } from "next";
import { TableOfContents, type TocItem } from "@/components/legal/table-of-contents";
import { LegalPlaceholder } from "@/components/legal/legal-placeholder";
import { PrintButton } from "@/components/legal/print-button";

export const metadata: Metadata = {
  title: "Privacy Policy | E-Liv Logistics",
  description:
    "E-Liv Logistics Privacy Policy. Details on personal data collection, usage, legal bases, international transfers, retention, and privacy rights under GDPR, CCPA, and DPDP Act.",
};

const tocItems: TocItem[] = [
  { id: "who-we-are", title: "Who we are", number: 1 },
  { id: "scope", title: "Scope", number: 2 },
  { id: "data-we-collect", title: "Data we collect", number: 3 },
  { id: "how-we-use-data", title: "How we use data and legal bases", number: 4 },
  { id: "who-we-share-data-with", title: "Who we share data with", number: 5 },
  { id: "international-transfers", title: "International transfers", number: 6 },
  { id: "cookies-and-tracking", title: "Cookies and tracking", number: 7 },
  { id: "security", title: "Security", number: 8 },
  { id: "retention", title: "Retention", number: 9 },
  { id: "your-rights", title: "Your rights", number: 10 },
  { id: "canadian-residents", title: "Canadian residents", number: 11 },
  { id: "grievance-officer-india", title: "Grievance Officer (India)", number: 12 },
  { id: "third-party-links", title: "Third-party links", number: 13 },
  { id: "changes", title: "Changes", number: 14 },
  { id: "contact", title: "Contact", number: 15 },
];

export default function PrivacyPolicyPage() {
  return (
        <div className="bg-white text-neutral-900 min-h-screen">
          <div className="mx-auto w-full max-w-[1440px] px-6 pt-24 pb-20 sm:px-10 sm:pt-28 lg:px-14 lg:pt-32">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] lg:gap-14 xl:gap-16">
              {/* Left side: Sticky Table of Contents */}
              <TableOfContents
                items={tocItems}
                currentPath="/privacy-policy"
                contactEmail="privacy@elivlogistics.com"
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
                      <span className="text-neutral-300">·</span>
                      <span className="text-neutral-500 font-medium">
                        Last updated: <LegalPlaceholder>[DD Month 2026]</LegalPlaceholder>
                      </span>
                    </div>
                    <PrintButton />
                  </div>

                  <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl leading-[1.15]">
                    E-Liv Logistics — Privacy Policy
                  </h1>
                </header>

                {/* Document Body */}
                <article className="prose prose-neutral max-w-none space-y-12 text-[15px] sm:text-base leading-relaxed text-neutral-700">

                  {/* 1. Who we are */}
                  <section id="who-we-are" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        1
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Who we are
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        This website,{" "}
                        <a
                          href="http://www.elivlogistics.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                        >
                          www.elivlogistics.com
                        </a>{" "}
                        (the &quot;Site&quot;), is operated by{" "}
                        <LegalPlaceholder>[E-Liv Hitech Pvt. Ltd., 611 Sector-8, IMT Manesar, Haryana 122051, India]</LegalPlaceholder>{" "}
                        <LegalPlaceholder>[and its affiliate [U.S. entity name and address]]</LegalPlaceholder> (together &quot;E-Liv Logistics&quot;, &quot;we&quot;, &quot;us&quot;). We arrange freight forwarding, inland haulage, customs coordination and warehousing services for business customers. For privacy questions, write to{" "}
                        <LegalPlaceholder>
                          [<a
                            href="mailto:privacy@elivlogistics.com"
                            className="underline decoration-neutral-400 hover:decoration-neutral-950"
                          >
                            privacy@elivlogistics.com
                          </a>]
                        </LegalPlaceholder>.
                      </p>
                    </div>
                  </section>

                  {/* 2. Scope */}
                  <section id="scope" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        2
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Scope
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        This policy covers personal data we collect through the Site, our quote and careers forms, newsletter sign-ups, email and phone contact, and the shipment information you give us to provide services. Our service contracts and shipping documents may contain additional terms.
                      </p>
                    </div>
                  </section>

                  {/* 3. Data we collect */}
                  <section id="data-we-collect" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        3
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Data we collect
                      </h2>
                    </div>
                    <div className="mt-6 space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-black/8 bg-[#fbfbfa] p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wide">
                            Contact and business identity
                          </h3>
                          <p className="mt-2 text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">Examples:</span> Name, job title, company, business email, phone, billing address.
                          </p>
                          <p className="mt-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-neutral-700">Source:</span> You, via forms or email.
                          </p>
                        </div>

                        <div className="rounded-xl border border-black/8 bg-[#fbfbfa] p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wide">
                            Shipment data
                          </h3>
                          <p className="mt-2 text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">Examples:</span> Origin, destination, consignee/shipper contacts, commodity, weight, dimensions, HS codes, value, hazardous-material declarations.
                          </p>
                          <p className="mt-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-neutral-700">Source:</span> You, your suppliers or consignees.
                          </p>
                        </div>

                        <div className="rounded-xl border border-black/8 bg-[#fbfbfa] p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wide">
                            Compliance and onboarding data
                          </h3>
                          <p className="mt-2 text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">Examples:</span> Tax IDs (e.g. EIN), W-9, trade references, customs bonds and power-of-attorney documents.
                          </p>
                          <p className="mt-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-neutral-700">Source:</span> You, credit agencies.
                          </p>
                        </div>

                        <div className="rounded-xl border border-black/8 bg-[#fbfbfa] p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wide">
                            Job applicant data
                          </h3>
                          <p className="mt-2 text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">Examples:</span> Name, email, phone, location, position, LinkedIn profile, CV.
                          </p>
                          <p className="mt-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-neutral-700">Source:</span> You, via the careers form.
                          </p>
                        </div>

                        <div className="rounded-xl border border-black/8 bg-[#fbfbfa] p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wide">
                            Technical data
                          </h3>
                          <p className="mt-2 text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">Examples:</span> IP address, browser and device type, pages viewed, referring URL, approximate location.
                          </p>
                          <p className="mt-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-neutral-700">Source:</span> Automatically, via cookies and server logs.
                          </p>
                        </div>

                        <div className="rounded-xl border border-black/8 bg-[#fbfbfa] p-4 sm:p-5">
                          <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wide">
                            Communications
                          </h3>
                          <p className="mt-2 text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">Examples:</span> Emails, call notes, tracking enquiries.
                          </p>
                          <p className="mt-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-neutral-700">Source:</span> You.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm text-neutral-800">
                        <p>
                          We do not knowingly collect data from children under 16, and we ask you not to send sensitive personal data (health, biometrics, etc.) through the Site.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 4. How we use data and legal bases */}
                  <section id="how-we-use-data" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        How we use data and legal bases
                      </h2>
                    </div>

                    {/* Responsive Table 1 */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-black/10 shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[580px] border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-black/10 bg-[#f4f4f2] text-xs font-bold tracking-wider text-neutral-950 uppercase">
                              <th scope="col" className="px-5 py-3.5 sm:px-6">
                                Purpose
                              </th>
                              <th scope="col" className="px-5 py-3.5 sm:px-6">
                                Legal basis (GDPR / UK GDPR)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 bg-white text-neutral-700">
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Prepare quotes and respond to enquiries
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Steps prior to a contract; legitimate interests
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Book, route, track and deliver shipments; file customs entries
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Performance of contract; legal obligation
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Credit checks, invoicing, collections
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Contract; legitimate interests
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Comply with customs, export-control, sanctions and tax law
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Legal obligation
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Site security, fraud prevention, analytics
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Legitimate interests
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Newsletter and marketing emails
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Consent (withdraw anytime)
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Recruitment
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Steps prior to a contract; legitimate interests
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-neutral-700">
                        Under India&apos;s Digital Personal Data Protection Act, 2023, we process personal data on the basis of your consent or for legitimate uses permitted by that Act.
                      </p>
                    </div>
                  </section>

                  {/* 5. Who we share data with */}
                  <section id="who-we-share-data-with" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        5
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Who we share data with
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Freight movement requires sharing shipment data with third parties. We share only what each party needs:
                      </p>
                      <ul className="mt-3 list-disc space-y-2.5 pl-6 marker:text-neutral-500">
                        <li>
                          Motor carriers, ocean and air carriers, NVOCCs, drayage operators, warehouses and logistics partners handling your cargo.
                        </li>
                        <li>
                          Licensed customs brokers and government agencies (e.g. U.S. Customs and Border Protection, Canada Border Services Agency, port and tax authorities).
                        </li>
                        <li>
                          Cargo insurers and claims adjusters.
                        </li>
                        <li>
                          Service providers: hosting (Wix.com), email, CRM, analytics, payment and accounting tools, under contracts requiring confidentiality.
                        </li>
                        <li>
                          Professional advisers, auditors, and authorities where the law requires.
                        </li>
                        <li>
                          A buyer or successor in a merger or sale of business.
                        </li>
                      </ul>
                      <p className="pt-2">
                        We do not sell personal data, and we do not share it for cross-context behavioural advertising as those terms are defined under the California Consumer Privacy Act.
                      </p>
                    </div>
                  </section>

                  {/* 6. International transfers */}
                  <section id="international-transfers" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        6
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        International transfers
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        We operate from India and serve customers in the United States, Canada and elsewhere, so data is transferred across borders. Where required, we use safeguards such as Standard Contractual Clauses and contractual confidentiality and security commitments.
                      </p>
                    </div>
                  </section>

                  {/* 7. Cookies and tracking */}
                  <section id="cookies-and-tracking" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        7
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Cookies and tracking
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        We use strictly necessary cookies to run the Site, and, with your consent where required, analytics and marketing cookies. You can manage preferences through our cookie banner or browser settings. See our Cookie Policy. We honour Global Privacy Control signals where the law requires.
                      </p>
                    </div>
                  </section>

                  {/* 8. Security */}
                  <section id="security" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        8
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Security
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        The Site is served over HTTPS with TLS encryption. We apply access controls, least-privilege permissions, and vendor security reviews. No system is fully secure; tell us promptly at{" "}
                        <LegalPlaceholder>
                          [<a
                            href="mailto:privacy@elivlogistics.com"
                            className="underline decoration-neutral-400 hover:decoration-neutral-950"
                          >
                            privacy@elivlogistics.com
                          </a>]
                        </LegalPlaceholder>{" "}
                        if you suspect misuse.
                      </p>
                    </div>
                  </section>

                  {/* 9. Retention */}
                  <section id="retention" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        9
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Retention
                      </h2>
                    </div>

                    {/* Responsive Table 2 */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-black/10 shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-black/10 bg-[#f4f4f2] text-xs font-bold tracking-wider text-neutral-950 uppercase">
                              <th scope="col" className="px-5 py-3.5 sm:px-6">
                                Record
                              </th>
                              <th scope="col" className="px-5 py-3.5 sm:px-6">
                                Retention
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 bg-white text-neutral-700">
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Quote enquiries not converted
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                24 months from last contact
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Customer, shipment and customs records
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                As long as the account is active, then at least 5 years (U.S. customs record-keeping) or longer where tax law requires
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Job applications
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                12 months, unless you consent to longer
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Newsletter data
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Until you unsubscribe
                              </td>
                            </tr>
                            <tr className="hover:bg-neutral-50/70 transition-colors">
                              <td className="px-5 py-3.5 sm:px-6 font-medium text-neutral-900">
                                Server logs
                              </td>
                              <td className="px-5 py-3.5 sm:px-6">
                                Up to 12 months
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  {/* 10. Your rights */}
                  <section id="your-rights" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        10
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Your rights
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Depending on where you live, you may have the right to: access your data; correct it; delete it; restrict or object to processing; data portability; withdraw consent; opt out of sale/sharing and targeted advertising; limit use of sensitive data; nominate a person to exercise your rights (India DPDP Act); and complain to a regulator (EU/UK supervisory authority, Office of the Privacy Commissioner of Canada, California Privacy Protection Agency, or the Data Protection Board of India). We will not discriminate against you for exercising these rights.
                      </p>
                      <p>
                        To make a request, email{" "}
                        <LegalPlaceholder>
                          [<a
                            href="mailto:privacy@elivlogistics.com"
                            className="underline decoration-neutral-400 hover:decoration-neutral-950"
                          >
                            privacy@elivlogistics.com
                          </a>]
                        </LegalPlaceholder>{" "}
                        or call <LegalPlaceholder>[toll-free number]</LegalPlaceholder>. We verify identity before acting and reply within the time the applicable law sets (generally 30 to 45 days).
                      </p>
                    </div>
                  </section>

                  {/* 11. Canadian residents */}
                  <section id="canadian-residents" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        11
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Canadian residents
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        We handle personal information in line with PIPEDA and applicable provincial law. Our Privacy Officer is <LegalPlaceholder>[name, email]</LegalPlaceholder>.
                      </p>
                    </div>
                  </section>

                  {/* 12. Grievance Officer (India) */}
                  <section id="grievance-officer-india" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        12
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Grievance Officer (India)
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        <LegalPlaceholder>[Name], [email], [address]</LegalPlaceholder>. We acknowledge grievances within <LegalPlaceholder>[7]</LegalPlaceholder> days.
                      </p>
                    </div>
                  </section>

                  {/* 13. Third-party links */}
                  <section id="third-party-links" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        13
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Third-party links
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        Carrier tracking links and other third-party sites follow their own privacy policies.
                      </p>
                    </div>
                  </section>

                  {/* 14. Changes */}
                  <section id="changes" className="scroll-mt-28 border-b border-black/8 pb-10">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        14
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Changes
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p>
                        We will post updates here and change the &quot;Last updated&quot; date; material changes will be notified by email or Site notice.
                      </p>
                    </div>
                  </section>

                  {/* 15. Contact */}
                  <section id="contact" className="scroll-mt-28">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                        15
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                        Contact
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p className="rounded-xl border border-black/8 bg-[#fbfbfa] p-5">
                        <LegalPlaceholder>[E-Liv Hitech Pvt. Ltd.]</LegalPlaceholder>, <LegalPlaceholder>[address]</LegalPlaceholder> ·{" "}
                        <LegalPlaceholder>
                          [<a
                            href="mailto:privacy@elivlogistics.com"
                            className="underline decoration-neutral-400 hover:decoration-neutral-950"
                          >
                            privacy@elivlogistics.com
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
