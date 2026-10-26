import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";
import treatmentsData from "../../data/treatmentsData";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CallIcon from "@mui/icons-material/Call";
import VerifiedIcon from "@mui/icons-material/Verified";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BoltIcon from "@mui/icons-material/Bolt";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import StarIcon from "@mui/icons-material/Star";
import { GTAG_CONVERSIONS } from "../../utils/gtagConversions";

const fireBookAppointmentConversion = () => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", { send_to: GTAG_CONVERSIONS.BOOK_APPOINTMENT });
  }
};

const PHONE = "+918708362763";
const PHONE_DISPLAY = "+91 8708362763";

const HIGHLIGHT_ICONS = {
  success: VerifiedIcon,
  time: AccessTimeIcon,
  bolt: BoltIcon,
  shield: HealthAndSafetyIcon,
  star: StarIcon,
  check: CheckIcon,
};

const TreatmentPage = () => {
  const { slug } = useParams();
  const page = treatmentsData[slug];

  const navItems = [
    ...(page?.sections?.map((s, i) => ({ id: `section-${i}`, label: s.title })) || []),
    ...(page?.procedureSteps?.length ? [{ id: "procedure", label: "Procedure" }] : []),
    ...(page?.faqs?.length ? [{ id: "faqs", label: "FAQs" }] : []),
  ];

  const [activeSection, setActiveSection] = useState(navItems[0]?.id);
  const [openFaqs, setOpenFaqs] = useState({ 0: true });

  // Scroll-spy: highlight the tab for the section currently in view.
  useEffect(() => {
    if (!page) return;
    const ids = [
      ...(page.sections?.map((_, i) => `section-${i}`) || []),
      ...(page.procedureSteps?.length ? ["procedure"] : []),
      ...(page.faqs?.length ? ["faqs"] : []),
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [slug, page]);

  const handleScrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const title =
    page?.title ||
    slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Prefer the finalized per-treatment seoTitle/seoDescription copy when
  // present; otherwise fall back to the generated template (used for any
  // slug without dedicated SEO copy yet).
  const metaTitle = page?.seoTitle || `${title} in Sonipat | Dental Clinic`;
  // Trim to the last full word within ~155 chars so the snippet doesn't end
  // mid-word, then add an ellipsis (targets the 150-160 char SEO range).
  const buildDescription = (content) => {
    if (!content) return null;
    if (content.length <= 160) return content;
    const truncated = content.slice(0, 155);
    return `${truncated.slice(0, truncated.lastIndexOf(" "))}…`;
  };
  const metaDescription =
    page?.seoDescription ||
    buildDescription(page?.content) ||
    `Learn about ${title} at Dental Clinic, Sonipat. Call ${PHONE_DISPLAY} to book your consultation with our expert dental team today.`;
  const canonicalUrl = `https://dentalclinic.example.com/treatments/${slug}`;

  // Fallback for slugs without data.
  if (!page) {
    return (
      <>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <BreadcrumbBanner
          title={title}
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Treatments", path: "/treatments" },
            { label: title },
          ]}
          showTitle={false}
        />
        <div className="max-w-4xl mx-auto px-4 py-[64px] text-center">
          <h1 className="text-[#003366] text-3xl font-bold mb-3">{title}</h1>
          <p className="text-gray-600 mb-4">
            Detailed information about this treatment will be available soon.
          </p>
          <a href={`tel:${PHONE}`} className="text-accent font-semibold no-underline">
            Call us at {PHONE_DISPLAY}
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={`${title} Sonipat, ${title} cost Sonipat, Dental Clinic treatments`} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      {page.img && <meta property="og:image" content={`https://dentalclinic.example.com${page.img}`} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {page.img && <meta name="twitter:image" content={`https://dentalclinic.example.com${page.img}`} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalProcedure",
            name: title,
            description: metaDescription,
            url: canonicalUrl,
            ...(page.img ? { image: `https://dentalclinic.example.com${page.img}` } : {}),
            provider: {
              "@type": "Dentist",
              name: "Dental Clinic",
              url: "https://dentalclinic.example.com/",
            },
          }),
        }}
      />
      <BreadcrumbBanner
        title={title}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Treatments", path: "/treatments" },
          { label: title },
        ]}
        showTitle={false}
      />

      {/* SECTION 1 — Hero */}
      <section className="bg-gray-50 py-[48px]">
        <div className="max-w-4xl mx-auto px-[32px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-[#003366] text-3xl md:text-[40px] font-extrabold leading-tight">
                {title}
              </h1>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  to="/book-appointment"
                  onClick={fireBookAppointmentConversion}
                  className="inline-block no-underline bg-accent hover:bg-accent-dark text-white rounded-xl px-6 py-3 text-[15px] font-semibold transition-colors duration-200"
                >
                  Book Appointment
                </Link>
                <a
                  href={`tel:${PHONE}`}
                  className="inline-flex items-center gap-2 no-underline border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white rounded-xl px-6 py-3 text-[15px] font-semibold transition-colors duration-200"
                >
                  <CallIcon className="text-[18px]!" />
                  Call Now
                </a>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {page.img && (
                <img
                  src={page.img}
                  alt={title}
                  className="w-full max-w-[250px] max-h-[250px] h-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky section tabs */}
      {navItems.length > 0 && (
        <div className="sticky top-[70px] z-30 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-[32px]">
            <div className="flex gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScrollTo(item.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold border transition-colors duration-200 cursor-pointer ${
                    activeSection === item.id
                      ? "bg-accent border-accent text-white"
                      : "border-[#003366]/30 text-[#003366] hover:border-[#003366]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2 — Key highlights */}
      {page.highlights?.length > 0 && (
        <div className="max-w-4xl mx-auto px-[32px] pt-[32px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {page.highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[h.icon] || CheckIcon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 text-center"
                >
                  <Icon className="text-accent text-[28px]! mb-1" />
                  <p className="font-numbers text-[#003366] text-lg font-extrabold leading-tight">
                    {h.stat}
                  </p>
                  <p className="text-gray-500 text-[13px]">{h.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3 — Content */}
      <div className="max-w-4xl mx-auto px-[32px]">
        {page.content && (
          <p className="text-gray-700 text-base leading-[1.8] max-w-[65ch] pt-[32px]">
            {page.content}
          </p>
        )}

        {page.sections?.map((section, i) => (
          <section
            key={i}
            id={`section-${i}`}
            className="scroll-mt-[140px] py-[32px] border-b border-gray-100"
          >
            <h2 className="text-[#003366] text-2xl font-bold mb-4">
              {section.title}
            </h2>
            {section.content && (
              <p className="text-gray-700 text-base leading-[1.8] max-w-[65ch]">
                {section.content}
              </p>
            )}

            {section.bullets?.length > 0 && (
              <ul className="mt-4 space-y-2 max-w-[65ch]">
                {section.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700 text-base leading-snug">
                    <CheckIcon className="text-accent text-[18px]! mt-1 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-[15px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {section.table.headers.map((h, k) => (
                        <th
                          key={k}
                          className="px-4 py-3 font-bold text-[#003366]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, r) => (
                      <tr key={r} className={r % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {row.map((cell, c) => (
                          <td key={c} className="px-4 py-3 text-gray-700 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {/* SECTION 4 — Procedure timeline */}
        {page.procedureSteps?.length > 0 && (
          <section id="procedure" className="scroll-mt-[140px] py-[32px] border-b border-gray-100">
            <h2 className="text-[#003366] text-2xl font-bold mb-6">
              Treatment Procedure
            </h2>
            <div>
              {page.procedureSteps.map((step, i) => {
                const last = i === page.procedureSteps.length - 1;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[15px] shrink-0">
                        {i + 1}
                      </div>
                      {!last && <div className="w-px flex-grow bg-gray-200 my-1" />}
                    </div>
                    <div className={last ? "" : "pb-8"}>
                      <h3 className="text-[#003366] text-base font-semibold mb-1">
                        {step.step}
                      </h3>
                      <p className="text-gray-700 text-base leading-[1.8] max-w-[60ch]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 5 — FAQ */}
        {page.faqs?.length > 0 && (
          <section id="faqs" className="scroll-mt-[140px] py-[32px]">
            <h2 className="text-[#003366] text-2xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {page.faqs.map((faq, i) => {
                const open = !!openFaqs[i];
                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 px-6 py-4">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaqs((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <span className="text-[#003366] text-[15px] md:text-base font-semibold leading-snug">
                        {faq.question}
                      </span>
                      <AddIcon
                        className={`text-[#003366] shrink-0 transition-transform duration-300 ${
                          open ? "rotate-45" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        {faq.answerBlocks ? (
                          faq.answerBlocks.map((block, bi) =>
                            block.type === "ul" ? (
                              <div key={bi} className="mt-3 first:mt-0">
                                {block.label && (
                                  <p
                                    className="text-gray-600 text-[15px] font-semibold mb-1"
                                    style={{ lineHeight: 1.7 }}
                                  >
                                    {block.label}
                                  </p>
                                )}
                                <ul className="list-disc pl-5 space-y-1">
                                  {block.items.map((item, ii) => (
                                    <li
                                      key={ii}
                                      className="text-gray-600 text-[15px]"
                                      style={{ lineHeight: 1.7 }}
                                    >
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p
                                key={bi}
                                className="text-gray-600 text-[15px] mt-3 first:mt-0"
                                style={{ lineHeight: 1.7 }}
                              >
                                {block.text}
                              </p>
                            )
                          )
                        ) : (
                          <p className="text-gray-600 text-[15px]" style={{ lineHeight: 1.7 }}>
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FAQ structured data (JSON-LD) for SEO rich results */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: page.faqs.map((f) => ({
                    "@type": "Question",
                    name: f.question,
                    acceptedAnswer: { "@type": "Answer", text: f.answer },
                  })),
                }),
              }}
            />
          </section>
        )}
      </div>

      {/* SECTION 6 — Bottom CTA banner */}
      <section className="bg-[#0D1B4A] py-[48px] md:py-[64px]">
        <div className="max-w-4xl mx-auto px-[32px] text-center">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
            Ready to get started?
          </h2>
          <p className="text-gray-300 text-base mb-8">
            Book your {title.toLowerCase()} consultation today.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/book-appointment"
              onClick={fireBookAppointmentConversion}
              className="inline-block no-underline bg-accent hover:bg-accent-dark text-white rounded-xl px-7 py-3 text-[15px] font-semibold transition-colors duration-200"
            >
              Book Appointment
            </Link>
            <a
              href={`tel:${PHONE}`}
              className="inline-flex items-center gap-2 no-underline border-2 border-white text-white hover:bg-white hover:text-[#0D1B4A] rounded-xl px-7 py-3 text-[15px] font-semibold transition-colors duration-200"
            >
              <CallIcon className="text-[18px]!" />
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default TreatmentPage;
