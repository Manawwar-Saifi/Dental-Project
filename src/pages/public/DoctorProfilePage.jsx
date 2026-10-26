import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import submitEnquiry from "../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../utils/nameInput";
import { toast } from "react-toastify";
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";

// Note: Dr. Ujjwal Prem and Dr. Ajay Kaushik intentionally have NO entry here
// — they each have a dedicated static SEO page (DoctorProfile.jsx and
// DoctorProfileAjayKaushik.jsx) at /doctors/ujjwal-prem and
// /doctors/ajay-kaushik. Adding them here would create a second, differently
// worded, competing URL for the same person (duplicate-content risk).
const doctors = [
  {
    name: "Dr. Alisha Dogra",
    slug: "dr-alisha",
    experience: "5",
    specialization: "General & Preventive Dentistry",
    role: "General & Preventive Dentistry",
    img: "/doctors/alisha.jpg",
    qualifications: "",
    location: "Sonipat, Haryana",
    bio: "Dr. Alisha Dogra is a dental surgeon with 5 years of experience in general and preventive dentistry, focused on gentle, comfortable care for every patient.",
    stats: [],
    expertise: [
      "General dentistry",
      "Scaling & polishing",
      "Dental fillings",
      "Root canal treatment",
      "Teeth whitening",
      "Preventive care",
    ],
    achievements: [],
  },
];

const DoctorProfilePage = () => {
  const { slug } = useParams();
  const doctor = doctors.find((d) => d.slug === slug);

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  if (!doctor) {
    return (
      <>
        <title>Doctor Not Found | Dental Clinic</title>
        <meta name="robots" content="noindex, follow" />
        <BreadcrumbBanner
          title="Doctor Not Found"
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Our Doctors" },
            { label: "Not Found" },
          ]}
        />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p style={{ fontSize: "1.1rem" }} className="text-gray-500 mb-6">
            The doctor profile you are looking for does not exist.
          </p>
          <Link
            to="/"
            className="inline-block no-underline text-white rounded-full px-8 py-3"
            style={{ backgroundColor: "#003366", fontSize: "0.95rem", fontWeight: 700 }}
          >
            Go Home
          </Link>
        </div>
      </>
    );
  }

  const canonicalUrl = `https://dentalclinic.example.com/doctors/${doctor.slug}`;
  const imageUrl = `https://dentalclinic.example.com${doctor.img}`;
  const metaTitle = `${doctor.name} — ${doctor.specialization} in Sonipat | Dental Clinic`;
  const metaDescription = `${doctor.name}, ${doctor.specialization} with ${doctor.experience}+ years of experience at Dental Clinic, Sonipat. Book an appointment today.`;

  return (
    <>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta
        name="keywords"
        content={`${doctor.name}, ${doctor.specialization} Sonipat, dentist Sonipat, Dental Clinic`}
      />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dentist",
            "@id": `${canonicalUrl}#person`,
            name: doctor.name,
            jobTitle: doctor.specialization,
            description: metaDescription,
            image: imageUrl,
            url: canonicalUrl,
            telephone: "+91-8708362763",
            worksFor: {
              "@type": "Dentist",
              "@id": "https://dentalclinic.example.com/#sonipat",
              name: "Dental Clinic",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Sonipat",
              addressRegion: "Haryana",
              addressCountry: "IN",
            },
            medicalSpecialty: doctor.specialization,
            knowsAbout: doctor.expertise,
          }),
        }}
      />
      <BreadcrumbBanner
        title={doctor.name}
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Our Doctors" },
          { label: doctor.name },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Left Sidebar — Doctor Card */}
          <div className="md:col-span-3">
            <div className="rounded-[10px] overflow-hidden bg-gray-100">
              <img
                src={doctor.img}
                alt={doctor.name}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
            <div className="mt-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className="text-[#003366]"
                    style={{ fontSize: "1.1rem", fontWeight: 800 }}
                  >
                    {doctor.name}
                  </p>
                  {doctor.role && (
                    <p
                      className="text-gray-500"
                      style={{ fontSize: "0.8rem" }}
                    >
                      ({doctor.role})
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 text-center rounded-[8px] px-2 py-1"
                  style={{ backgroundColor: "#fde8d0", fontSize: "0.7rem", fontWeight: 700, color: "#c26e1a" }}
                >
                  {doctor.experience}+ Yrs<br />Exp
                </span>
              </div>
              {doctor.qualifications && (
                <div className="mt-3">
                  <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Qualification</p>
                  <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>{doctor.qualifications}</p>
                </div>
              )}
              <div className="mt-3 flex items-center gap-1 text-gray-500">
                <LocationOnIcon className="text-[16px]!" />
                <p style={{ fontSize: "0.8rem" }}>{doctor.location}</p>
              </div>
            </div>
          </div>

          {/* Middle Content */}
          <div className="md:col-span-6">
            {/* About Doctor */}
            <div className="mb-8">
              <h2
                className="text-[#1a1a1a] mb-4"
                style={{ fontSize: "1.3rem", fontWeight: 700 }}
              >
                About Doctor
              </h2>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontSize: "0.9rem", lineHeight: 1.8 }}
              >
                {doctor.bio}
              </p>
            </div>

            {/* Stats Bar */}
            {doctor.stats.length > 0 && (
            <div className="flex flex-wrap border border-gray-200 rounded-[8px] mb-8 overflow-hidden">
              {doctor.stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[100px] text-center py-4 px-2"
                  style={{ borderRight: i < doctor.stats.length - 1 ? "1px solid #e5e7eb" : "none" }}
                >
                  <p
                    className="text-[#003366]"
                    style={{ fontSize: "1.2rem", fontWeight: 800 }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-gray-500"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            )}

            {/* Expertise */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: "1.2rem" }}>🦷</span>
                <h2
                  className="text-[#1a1a1a]"
                  style={{ fontSize: "1.2rem", fontWeight: 700 }}
                >
                  Expertise
                </h2>
              </div>
              <div className="h-[2px] bg-gray-200 mb-4" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {doctor.expertise.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircleOutlineIcon
                      className="text-[16px]! mt-0.5 shrink-0"
                      style={{ color: "#555" }}
                    />
                    <span
                      className="text-gray-600"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {doctor.achievements.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: "1.2rem" }}>🏆</span>
                <h2
                  className="text-[#1a1a1a]"
                  style={{ fontSize: "1.2rem", fontWeight: 700 }}
                >
                  Achievements
                </h2>
              </div>
              <div className="h-[2px] bg-gray-200 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {doctor.achievements.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircleOutlineIcon
                      className="text-[16px]! mt-0.5 shrink-0"
                      style={{ color: "#555" }}
                    />
                    <span
                      className="text-gray-600"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* Right Sidebar — Appointment Form */}
          <div className="md:col-span-3">
            <div className="sticky top-24 bg-white rounded-[10px] border border-gray-200 p-5 shadow-sm">
              <h3
                className="text-[#003366] mb-2"
                style={{ fontSize: "1.1rem", fontWeight: 800 }}
              >
                Book Appointment with {doctor.name}
              </h3>
              <p
                className="text-gray-500 mb-5"
                style={{ fontSize: "0.8rem" }}
              >
                Book your free consultation today and take the first step towards healthy, beautiful teeth.
              </p>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder={NAME_PLACEHOLDER}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: filterName(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-[5px] border border-[#e88a1a] outline-none focus:border-[#c26e1a] transition-colors"
                  style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
                />
                <input
                  type="tel"
                  placeholder="Your Phone*"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[5px] border border-[#e88a1a] outline-none focus:border-[#c26e1a] transition-colors"
                  style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
                />
                <input
                  type="email"
                  placeholder="Your Email*"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[5px] border border-[#e88a1a] outline-none focus:border-[#c26e1a] transition-colors"
                  style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
                />
                <div className="flex justify-center" style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                  <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!captchaToken) {
                      toast.warn("Please complete the reCAPTCHA verification.");
                      return;
                    }
                    const ok = await submitEnquiry({ name: form.name, email: form.email, phone: form.phone, treatment: `Appointment - ${doctor.name}`, pagePath: `/doctors/${doctor.slug}`, pageLabel: "Doctor Profile" });
                    if (ok) { setForm({ name: "", phone: "", email: "" }); setCaptchaToken(null); captchaRef.current?.reset(); }
                  }}
                  className="w-full py-3 text-white rounded-[5px] uppercase tracking-wide cursor-pointer hover:opacity-90 transition-colors"
                  style={{ backgroundColor: "#c0392b", fontSize: "14px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}
                >
                  Book a Free Consultation
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default DoctorProfilePage;
