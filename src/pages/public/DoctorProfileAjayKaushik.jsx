import { Link } from "react-router-dom";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { GTAG_CONVERSIONS } from "../../utils/gtagConversions";

const fireBookAppointmentConversion = () => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", { send_to: GTAG_CONVERSIONS.BOOK_APPOINTMENT });
  }
};

const stats = [
  { value: "15+", label: "Years Experience" },
  { value: "2022", label: "Assistant Professor Since" },
  { value: "IDA", label: "Professional Member" },
];

const credentials = [
  { icon: <WorkOutlineIcon />, text: "Assistant Professor — Department of Dentistry, World Medical College (since Jan 2022)" },
  { icon: <SchoolIcon />, text: "BDS & MDS — DAV Dental College, Yamunanagar" },
  { icon: <ShieldOutlinedIcon />, text: "Member — Haryana State Dental Council" },
  { icon: <GroupsIcon />, text: "Member — Indian Dental Association (IDA)" },
  { icon: <WorkspacePremiumIcon />, text: "Published researcher — national & international dental journals" },
  { icon: <MedicalServicesIcon />, text: "15+ years of clinical and academic experience" },
];

const expertise = [
  "General Dentistry",
  "Evidence-Based Clinical Practice",
  "Dental Implants",
  "Root Canal Treatment",
  "Orthodontics",
  "Cosmetic Dentistry",
];

const socials = [
  {
    icon: <WhatsAppIcon />,
    label: "9467776028",
    href: "https://wa.me/919467776028",
    color: "#25D366",
  },
  {
    icon: <YouTubeIcon />,
    label: "Dental Clinic",
    href: "https://www.youtube.com/",
    color: "#FF0000",
  },
  {
    icon: <InstagramIcon />,
    label: "Dental Clinic",
    href: "https://www.instagram.com/",
    color: "#E1306C",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  "@id": "https://dentalclinic.example.com/doctors/ajay-kaushik#person",
  name: "Dr. Ajay Kaushik",
  jobTitle: "Assistant Professor, Department of Dentistry",
  description:
    "Dr. Ajay Kaushik, BDS MDS, is an experienced dentist with 15+ years in clinical dentistry and academic excellence at Dental Clinic, Sonipat.",
  image: "https://dentalclinic.example.com/doctors/ajay.webp",
  url: "https://dentalclinic.example.com/doctors/ajay-kaushik",
  telephone: "+91-8708362763",
  alumniOf: [{ "@type": "EducationalOrganization", name: "DAV Dental College, Yamunanagar" }],
  memberOf: [
    { "@type": "Organization", name: "Haryana State Dental Council" },
    { "@type": "Organization", name: "Indian Dental Association (IDA)" },
  ],
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
  medicalSpecialty: "General Dentistry",
  knowsAbout: [
    "Dental Implants",
    "Root Canal Treatment",
    "Orthodontics",
    "Evidence-Based Dentistry",
    "Cosmetic Dentistry",
    "Family Dentistry",
  ],
};

const DoctorProfileAjayKaushik = () => {
  return (
    <>
      <title>
        Dr. Ajay Kaushik — Dentist in Sonipat | Dental Clinic
      </title>
      <meta
        name="description"
        content="Dr. Ajay Kaushik, BDS MDS, is an experienced dentist at Dental Clinic, Sonipat with 15+ years in clinical dentistry. Book an appointment today."
      />
      <meta
        name="keywords"
        content="Dr Ajay Kaushik, dentist Sonipat, BDS MDS Sonipat, Dental Clinic, dental clinic Sonipat, best dentist Sonipat"
      />
      <link rel="canonical" href="https://dentalclinic.example.com/doctors/ajay-kaushik" />
      <meta name="robots" content="index, follow" />
      <meta
        property="og:title"
        content="Dr. Ajay Kaushik — Dentist in Sonipat | Dental Clinic"
      />
      <meta
        property="og:description"
        content="BDS MDS dentist with 15+ years in clinical dentistry, dental research and patient care at Dental Clinic, Sonipat."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/doctors/ajay-kaushik" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/doctors/ajay.webp"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Dr. Ajay Kaushik — Dentist in Sonipat | Dental Clinic" />
      <meta
        name="twitter:description"
        content="BDS MDS dentist with 15+ years in clinical dentistry, dental research and patient care at Dental Clinic, Sonipat."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/doctors/ajay.webp"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SECTION 1 — HERO */}
      <section className="bg-navy">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Photo */}
            <div className="flex justify-center md:justify-start order-1">
              <img
                src="/doctors/ajay.webp"
                alt="Dr. Ajay Kaushik"
                className="w-full max-w-sm md:max-w-md lg:max-w-lg aspect-[4/5] object-cover object-top rounded-2xl border-4 border-white/20 shadow-2xl"
              />
            </div>

            {/* Text */}
            <div className="order-2 text-center md:text-left">
              <h1 className="text-white font-bold text-[28px] md:text-[36px] leading-tight">
                Dr. Ajay Kaushik — Dentist in Sonipat
              </h1>
              <p className="text-accent text-[18px] font-semibold mt-2">
                BDS, MDS — Assistant Professor, Department of Dentistry
              </p>
              <p className="text-white/80 text-base mt-3 leading-relaxed">
                General Dentistry | Evidence-Based Clinical Practice — Dental Care in Sonipat
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-7 max-w-md mx-auto md:mx-0">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white/10 backdrop-blur-sm rounded-xl px-2 py-4 text-center border border-white/10"
                  >
                    <p className="font-numbers text-white text-[20px] md:text-[22px] font-extrabold leading-none">
                      {s.value}
                    </p>
                    <p className="text-white/70 text-[11px] mt-1.5 leading-tight">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/book-appointment"
                onClick={fireBookAppointmentConversion}
                className="inline-flex items-center gap-2 mt-8 no-underline bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl px-7 py-3 text-[15px] transition-colors duration-200"
              >
                <EventAvailableIcon className="text-[20px]!" />
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — ABOUT */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <h2 className="text-navy font-bold text-[28px] mb-5">
            About Dr. Ajay Kaushik
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Dr. Ajay Kaushik is presently serving as an Assistant Professor in
            the Department of Dentistry at World Medical College since January
            2022. He completed both his Bachelor of Dental Surgery (BDS) and
            Master of Dental Surgery (MDS) from DAV Dental College,
            Yamunanagar.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mt-4">
            With over 15 years of clinical and academic experience,
            Dr. Kaushik has consistently demonstrated excellence in dental
            education, patient care, and research. His professional journey
            reflects a strong commitment to integrating evidence-based
            dentistry into both teaching and practice.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mt-4">
            Dr. Kaushik has actively contributed to research and publications
            in reputed national and international dental journals, focusing
            on advancing knowledge in his field of specialization. He has also
            participated in numerous conferences, workshops, and continuing
            dental education programs, where he presented papers and shared
            insights with peers, further strengthening his academic and
            professional standing.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mt-4">
            As a member of recognized professional bodies such as Haryana
            State Dental Council and the Indian Dental Association (IDA), he
            remains engaged with the latest developments in dentistry and
            continues to contribute to the growth of the profession.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mt-4">
            Respected for his dedication, precision, and student-centric
            approach, Dr. Kaushik plays an active role in mentoring aspiring
            dentists and shaping the next generation of dental professionals.
            His vision is to combine academic excellence, research innovation,
            and compassionate clinical practice for the overall advancement of
            dental health care in Sonipat and beyond.
          </p>
        </div>
      </section>

      {/* SECTION 3 — CREDENTIALS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <h2 className="text-navy font-bold text-[28px] text-center mb-10">
            Credentials &amp; Affiliations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((c) => (
              <div
                key={c.text}
                className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100"
              >
                <span className="shrink-0 flex items-center justify-center w-11 h-11 rounded-lg bg-orange-50 text-accent">
                  {/* icon sized to 24px */}
                  <span className="[&_svg]:text-[24px]!">{c.icon}</span>
                </span>
                <p className="text-gray-700 text-[15px] leading-snug self-center">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — EXPERTISE */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-navy font-bold text-[28px] text-center mb-10">
            Areas of Expertise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {expertise.map((item) => (
              <div
                key={item}
                className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-accent flex items-center"
              >
                <p className="text-navy text-[15px] font-semibold leading-snug">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — CONNECT */}
      <section className="bg-navy py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-white font-bold text-[24px] mb-8">
            Connect with Dr. Ajay Kaushik
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 no-underline bg-white/10 hover:bg-white/20 rounded-full px-5 py-2.5 transition-colors duration-200"
              >
                <span
                  className="inline-flex [&_svg]:text-[24px]!"
                  style={{ color: s.color }}
                >
                  {s.icon}
                </span>
                <span className="text-white text-[14px] font-medium">
                  {s.label}
                </span>
              </a>
            ))}
          </div>

          <Link
            to="/book-appointment"
            onClick={fireBookAppointmentConversion}
            className="inline-flex items-center gap-2 mt-9 no-underline bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl px-7 py-3 text-[15px] transition-colors duration-200"
          >
            <EventAvailableIcon className="text-[20px]!" />
            Book Appointment
          </Link>
        </div>
      </section>

      {/* SECTION 6 — CTA BANNER */}
      <section className="bg-accent py-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-white font-bold text-[24px] leading-tight">
              Ready for expert dental care in Sonipat?
            </h2>
            <p className="text-white/80 text-base mt-2">
              Schedule a consultation with Dr. Ajay Kaushik today
            </p>
          </div>
          <Link
            to="/book-appointment"
            onClick={fireBookAppointmentConversion}
            className="shrink-0 no-underline bg-white text-accent hover:bg-white/90 font-bold rounded-xl px-8 py-3 text-[15px] transition-colors duration-200"
          >
            Book Now
          </Link>
        </div>
      </section>
    </>
  );
};

export default DoctorProfileAjayKaushik;
