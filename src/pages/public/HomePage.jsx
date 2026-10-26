import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { CLINIC_NAME } from "../../constants/clinic.js";
import { Swiper, SwiperSlide } from "swiper/react";
import MembershipPlansSection from "../../components/public/MembershipPlansSection";
import {
  Autoplay,
  Pagination,
  EffectFade,
  Navigation,
  FreeMode,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import "swiper/css/effect-fade";
import "swiper/css/navigation";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import GroupsIcon from "@mui/icons-material/Groups";
import VerifiedIcon from "@mui/icons-material/Verified";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AddIcon from "@mui/icons-material/Add";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BoltIcon from "@mui/icons-material/Bolt";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import Patient1 from "../../../public/patient-1.webp";
import Patient2 from "../../../public/patient-2.webp";
import Patient3 from "../../../public/patient-3.webp";

const treatmentCards = [
  { title: "Teeth Braces", slug: "braces", img: "/images/braces.png" },
  { title: "Mouth Ulcers", slug: "mouth-ulcers", img: "/images/mouth-ulcers.png" },
  { title: "Dental Implant", slug: "dental-implant", img: "/images/dental-implant.png" },
  { title: "Aligners", slug: "clear-aligners", img: "/images/clear-aligner.png" },
  { title: "Kids Dentistry", slug: "kids-dentistry", img: "/images/kid-dentistry.png" },
  { title: "Laser Dentistry", slug: "laser-dentistry", img: "/images/laser-dentistry.png" },
  { title: "Root Canal Treatment", slug: "root-canal-treatment-rct", img: "/images/root-canal.png" },
  { title: "Dental Crowns", slug: "dental-crowns-and-bridges", img: "/images/dental-crown-and-bridges.png" },
  { title: "Dental Fillings", slug: "dental-filling", img: "/images/dental-filling.png" },
  { title: "Wisdom Teeth Extraction", slug: "wisdom-teeth", img: "/images/wisdom-teeth.png" },
  { title: "Dentures", slug: "dentures", img: "/images/dentures.png" },
  { title: "Advanced Gum Treatment", slug: "gum-disease-treatment", img: "/images/gum-deases-treatment.png" },
];

const doctors = [
  { name: "Dr. Ujjwal Prem", subtitle: "MDS (Oral and Maxillofacial Surgeon)", experience: "15+ Yrs Experience", lead: true, img: "/doctors/ujjwal.jpg", to: "/doctors/ujjwal-prem" },
  { name: "Dr. Alisha Dogra", subtitle: "BDS — Bachelor of Dental Surgery", experience: "5+ Yrs Experience", lead: false, img: "/doctors/alisha.jpg" },
  {
    name: "Dr. Ajay Kaushik",
    experience: "15+ Yrs Experience",
    subtitle: "MDS — Orthodontics & Dentofacial Orthopaedics | Asst. Professor",
    lead: false,
    img: "/doctors/ajay.webp",
    to: "/doctors/ajay-kaushik",
  },
  {
    name: "Dr. Shivani Sharma",
    experience: "15+ Yrs Experience",
    subtitle: "MDS — Periodontist",
    lead: false,
    img: "/doctors/shivani.webp",
  },
  {
    name: "Dr. Aashish Sonik",
    experience: "500+ Implants Placed",
    subtitle: "BDS, MBA, Fellowship in Implantology",
    lead: false,
    img: "/doctors/dr-sonik.jpg",
    to: "/doctors/aashish-sonik",
  },
];

// Patient testimonial reels (Cloudinary). videoUrl plays inline in each card.
const patientSpeaks = [
  {
    name: "Patient Review",
    treatment: "Dental Care",
    videoUrl:
      "https://res.cloudinary.com/douaodgru/video/upload/v1780553951/Reel1_ucd1ts.mp4",
  },
  {
    name: "Patient Review",
    treatment: "Dental Implants",
    videoUrl:
      "https://res.cloudinary.com/douaodgru/video/upload/v1780553952/Dental_implant_patients_review_smile_dentalcrowns_dentalimplant_instapost_instagood_instag_ul9sqy.mp4",
  },
  {
    name: "Smile Design",
    treatment: "Dental Veneers",
    videoUrl:
      "https://res.cloudinary.com/douaodgru/video/upload/v1780553950/SMILE_DESIGN_BY_DENTAL_VENEERS_SMILE_CONFIDENTLY_WITH_US_smile_dentalcare_instagood_instagra_p3uvce.mp4",
  },
  {
    name: "Ansh's Story",
    treatment: "Crown Treatment",
    videoUrl:
      "https://res.cloudinary.com/douaodgru/video/upload/v1780553949/Part_1_Ansh_was_experiencing_toothache_and_an_infection_and_frequent_crown_removal.He_underwent_n8rmtz.mp4",
  },
];

const marqueeItems = [
  { icon: <GroupsIcon />, value: "10,000+", label: "Happy Patients" },
  { icon: <MedicalServicesIcon />, value: "15+", label: "Treatments" },
  { icon: <VerifiedIcon />, value: "15+", label: "Years Experience" },
  { icon: <EventAvailableIcon />, value: "24/7", label: "Emergency Care" },
];

const heroBanners = [
  {
    desktop: "/banners/banner1-desktop.webp",
    mobile: "/banners/banner1-mobile.webp",
    alt: "Complete Family Dental Care - Dental Clinic Sonipat",
  },
  {
    desktop: "/banners/banner2-desktop.webp",
    mobile: "/banners/banner2-mobile.webp",
    alt: "Your Smile Our Priority - Smile Makeovers at Dental Clinic",
  },
  {
    desktop: "/banners/banner3-desktop.webp",
    mobile: "/banners/banner3-mobile.webp",
    alt: "Painless Laser Dentistry - Dr. Ujjwal at Dental Clinic",
  },
];

const treatments = [
  {
    title: "Dental Implant",
    slug: "dental-implant",
    img: "/images/dental-implant.png",
  },
  {
    title: "Root Canal Treatment RCT",
    slug: "root-canal-treatment-rct",
    img: "/images/root-canal.png",
  },
  {
    title: "Wisdom Teeth",
    slug: "wisdom-teeth",
    img: "/images/wisdom-teeth.png",
  },
  {
    title: "Clear Aligners",
    slug: "clear-aligners",
    img: "/images/clear-aligner.png",
  },
  {
    title: "Cosmatic Dental Bonding",
    slug: "cosmatic-dental-bonding",
    img: "/images/cosmatic-dental-bonding.png",
  },
  {
    title: "Laser Dentistry",
    slug: "laser-dentistry",
    img: "/images/laser-dentistry.png",
  },
  {
    title: "Kids Dentistry",
    slug: "kids-dentistry",
    img: "/images/kid-dentistry.png",
  },
  {
    title: "Dental Crowns and Bridges",
    slug: "dental-crowns-and-bridges",
    img: "/images/dental-crown-and-bridges.png",
  },
  {
    title: "Gum Disease Treatment",
    slug: "gum-disease-treatment",
    img: "/images/gum-deases-treatment.png",
  },
  { title: "View More", slug: "", img: "/images/view-more.png" },
];

const faqs = [
  {
    q: "What dental treatments does Dental Clinic in Sonipat offer?",
    a: "We offer 15+ treatments including dental implants, root canal (RCT), braces, clear aligners, teeth whitening, laser dentistry, kids dentistry, crowns & bridges, gum treatment, dentures, cosmetic bonding, wisdom teeth extraction, dental fillings, smile makeover, and mouth ulcer treatment. All treatments use modern equipment with painless laser options.",
  },
  {
    q: "How do I book an appointment at Dental Clinic?",
    a: "You can book online through our website 24/7 — select your preferred clinic, date, and time slot. You can also call us at +91 8708362763. Walk-in appointments are available during clinic hours.",
  },
  {
    q: "What are the clinic timings?",
    a: "We're open Monday to Saturday, 9:00 AM to 8:00 PM. Sunday consultations are available by appointment only. Emergency dental care is available — call us anytime.",
  },
  {
    q: "Do you offer painless dental treatment?",
    a: "Yes. We specialize in laser dentistry — no cuts, no stitches, minimal bleeding, and faster recovery. Most procedures including gum treatments and cavity fillings can be done painlessly with our advanced laser equipment.",
  },
  {
    q: "What are the dental membership plans and pricing?",
    a: "We offer three plans: Premium Dental Health Plan (₹499, includes ₹1,500 treatment coupon + free consultation & X-ray), Star Dental Health Plan (₹699, includes ₹1,500 coupon + free consultation & X-ray + ₹4,000 off on ortho & implants), and Implant Post Care (₹4,500). Plans are valid for 6 months. Buy online or at the clinic.",
  },
  {
    q: "Is Dental Clinic good for kids?",
    a: "Yes. We have a dedicated kids dentistry program for children from infancy through teens. Our doctors are experienced with pediatric patients and make dental visits comfortable and anxiety-free.",
  },
  {
    q: "Where is Dental Clinic located?",
    a: "We have two clinics in Sonipat, Haryana: Dental Clinic – Delhi Road (Plot 35/13, Delhi Rd, Sikka Colony, Lakshmi Nagar, Sonipat, Haryana 131001) and Dental Clinic – Parsvnath (Villa 445, A Block, Parsvnath City, Sonipat, Haryana 131001).",
  },
  {
    q: "Do you accept online payments?",
    a: "Yes. We accept online payments via Razorpay (cards, UPI, netbanking, wallets) for appointment bookings and membership plans. Cash and card payments are also accepted at the clinic.",
  },
];

const HomePage = () => {
  const [openFaqs, setOpenFaqs] = useState({});
  const reviewsPrevRef = useRef(null);
  const reviewsNextRef = useRef(null);
  const doctorsPrevRef = useRef(null);
  const doctorsNextRef = useRef(null);

  return (
    <div>
      <title>Best Dental Care Clinic in India | Dental Clinic</title>
      <meta
        name="description"
        content="Dental Clinic offers advanced dental care through its branches across India. Visit our expert dentists for implants, orthodontics, cosmetic dentistry, pediatric dentistry, and oral health treatments."
      />
      <meta
        name="keywords"
        content="best dentist Sonipat, dental clinic Sonipat, dental implants Sonipat, Dental Clinic"
      />
      <link rel="canonical" href="https://dentalclinic.example.com/" />
      <meta name="robots" content="index, follow" />
      <meta
        property="og:title"
        content="Best Dental Care Clinic in India | Dental Clinic"
      />
      <meta
        property="og:description"
        content="Dental Clinic offers advanced dental care through its branches across India. Visit our expert dentists for implants, orthodontics, cosmetic dentistry, pediatric dentistry, and oral health treatments."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Best Dental Care Clinic in India | Dental Clinic" />
      <meta
        name="twitter:description"
        content="Dental Clinic offers advanced dental care through its branches across India. Visit our expert dentists for implants, orthodontics, cosmetic dentistry, pediatric dentistry, and oral health treatments."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="geo.region" content="IN-HR" />
      <meta name="geo.placename" content="Sonipat" />
      <meta name="geo.position" content="28.9931;77.0151" />
      <meta name="ICBM" content="28.9931, 77.0151" />
      {/* Organization + Dentist + WebSite structured data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://dentalclinic.example.com/#organization",
                name: "Dental Clinic",
                legalName: CLINIC_NAME,
                url: "https://dentalclinic.example.com/",
                logo: "https://dentalclinic.example.com/dental-clinic-logo.png",
                sameAs: [
                  "https://www.instagram.com/",
                  "https://www.youtube.com/",
                  "https://www.facebook.com/",
                ],
              },
              {
                "@type": "Dentist",
                "@id": "https://dentalclinic.example.com/#sonipat",
                name: "Dental Clinic — Sonipat",
                url: "https://dentalclinic.example.com/",
                telephone: "+91 8708362763",
                priceRange: "Rs Rs",
                address: {
                  "@type": "PostalAddress",
                  streetAddress:
                    "Plot 35/13, Delhi Rd, Sikka Colony, Lakshmi Nagar",
                  addressLocality: "Sonipat",
                  addressRegion: "Haryana",
                  postalCode: "131001",
                  addressCountry: "IN",
                },
                parentOrganization: {
                  "@id": "https://dentalclinic.example.com/#organization",
                },
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://dentalclinic.example.com/#website",
            url: "https://dentalclinic.example.com/",
            name: "Dental Clinic",
            publisher: { "@id": "https://dentalclinic.example.com/#organization" },
          }),
        }}
      />
      {/* Hero Banner Slider */}
      <section className="relative w-full overflow-hidden">
        <Swiper
          modules={[Autoplay, EffectFade, Navigation]}
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          loop
          freeMode={true}
          speed={1500}
        >
          {heroBanners.map((banner, i) => (
            <SwiperSlide key={i}>
              <picture>
                {/* Desktop image ≥768px, mobile image below */}
                <source media="(min-width: 768px)" srcSet={banner.desktop} />
                <img
                  src={banner.mobile}
                  alt={banner.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="block w-full h-auto md:max-h-[400px] lg:max-h-[500px] md:object-cover"
                />
              </picture>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Stats Ticker */}
      <div className="w-full bg-orange-50 border-y border-orange-100 overflow-hidden">
        <div className="animate-marquee flex w-max">
          {[
            ...marqueeItems,
            ...marqueeItems,
            ...marqueeItems,
            ...marqueeItems,
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-10 py-4 shrink-0"
            >
              <span className="text-[#F57C00] text-[26px]">{item.icon}</span>
              <span className="font-numbers text-[#0D1B4A] whitespace-nowrap text-2xl font-bold">
                {item.value}
              </span>
              <span className="text-gray-500 whitespace-nowrap text-sm font-medium">
                {item.label}
              </span>
              <span className="text-[#F57C00]/30 ml-6">●</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <section className="py-[48px] md:py-[64px] bg-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h1 className="text-[#0D1B4A] text-center mb-3 text-3xl md:text-4xl font-bold">
            Comprehensive Dental Care for All Your Needs
          </h1>
          <p className="text-center text-gray-500 mb-12 max-w-3xl mx-auto w-[100%] md:w-[55%] text-base md:text-lg leading-relaxed">
            We take pride in providing a comprehensive range of dental services.
            Our state-of-the-art facilities and experienced professionals
            demonstrate our dedication to excellence.
          </p>

          <div className="text-center mb-6 flex items-center justify-center gap-4">
            <Link
              to="/treatments"
              className="text-accent text-[14px] font-medium no-underline hover:text-accent-dark transition-colors duration-200"
            >
              Explore now
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/dentist-in-sonipat"
              className="text-accent text-[14px] font-medium no-underline hover:text-accent-dark transition-colors duration-200"
            >
              Best Dentist in Sonipat
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {treatments.map((t) => (
              <Link
                key={t.slug || "view-more"}
                to={t.slug ? `/treatments/${t.slug}` : "/treatments"}
                className="flex flex-col items-center text-center py-8 px-4 rounded-2xl bg-white border border-gray-100 shadow-xs no-underline cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
              >
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <img
                    src={t.img}
                    alt={t.title}
                    loading="lazy"
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <span className="text-gray-700 text-[15px] font-medium">
                  {t.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-[48px] md:py-[64px] bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h2
            className="text-[#003366] text-center mb-3"
            style={{ fontSize: "2rem", fontWeight: 800 }}
          >
            Why Choose Dental Clinic?
          </h2>
          <p
            className="text-center text-gray-500 mb-12 max-w-3xl mx-auto w-[100%] md:w-[45%]"
            style={{ fontSize: "1rem" }}
          >
            Dental Clinic is
            committed to providing the best dental experience with modern technology
            and compassionate care
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Painless Laser Dentistry */}
            <div className="rounded-[10px]! p-6 transition-all duration-300 bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-[#e8f4fd]">
                  <span className="text-[24px]! text-[#006694]">
                    <BoltIcon />
                  </span>
                </div>
                <h3
                  className="text-[#003366] mb-2"
                  style={{ fontSize: "1.1rem", fontWeight: 700 }}
                >
                  Painless Laser Dentistry
                </h3>
                <p
                  className="text-gray-500 leading-relaxed"
                  style={{ fontSize: "0.75rem" }}
                >
                  Advanced laser treatments — no cuts, no stitches, minimal
                  bleeding. Faster recovery with precision procedures that most
                  clinics don&apos;t offer.
                </p>
              </div>
            </div>

            {/* 15+ Years of Expertise */}
            <div className="rounded-[10px]! p-6 transition-all duration-300 bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-[#e8f4fd]">
                  <span className="text-[24px]! text-[#006694]">
                    <WorkspacePremiumIcon />
                  </span>
                </div>
                <h3
                  className="text-[#003366] mb-2"
                  style={{ fontSize: "1.1rem", fontWeight: 700 }}
                >
                  15+ Years of Expertise
                </h3>
                <p
                  className="text-gray-500 leading-relaxed"
                  style={{ fontSize: "0.75rem" }}
                >
                  Over fifteen years of clinical experience across dental implants,
                  orthodontics, and oral surgery. Over 10,000 patients treated
                  with trusted, evidence-based care.
                </p>
              </div>
            </div>

            {/* Patient Reviews (highlighted) */}
            <div className="rounded-[10px]! overflow-hidden transition-all duration-300 text-white md:row-span-2 whychooseus-swiper shadow border p-1">
              <Swiper
                modules={[Autoplay, Pagination, FreeMode]}
                autoplay={{ delay: 2500, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                loop
                breakpoints={{
                  640: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                  },
                  768: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                  },
                }}
                speed={1500}
                className="h-full whychoouse-swiper-wrapper"
              >
                <SwiperSlide>
                  <img src={Patient1} alt="Patient Review 1" loading="lazy" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={Patient2} alt="Patient Review 2" loading="lazy" />
                </SwiperSlide>
                <SwiperSlide>
                  <img src={Patient3} alt="Patient Review 3" loading="lazy" />
                </SwiperSlide>
              </Swiper>
            </div>

            {/* Complete Family Dental Care */}
            <div className="rounded-[10px]! p-6 transition-all duration-300 bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-[#e8f4fd]">
                  <span className="text-[24px]! text-[#006694]">
                    <FamilyRestroomIcon />
                  </span>
                </div>
                <h3
                  className="text-[#003366] mb-2"
                  style={{ fontSize: "1.1rem", fontWeight: 700 }}
                >
                  Complete Family Dental Care
                </h3>
                <p
                  className="text-gray-500 leading-relaxed"
                  style={{ fontSize: "0.75rem" }}
                >
                  From kids&apos; first dental visit to senior dentures — one
                  clinic for the whole family. Preventive, cosmetic, and
                  restorative treatments all under one roof.
                </p>
              </div>
            </div>

            {/* 24/7 Emergency & Online Booking */}
            <div className="rounded-[10px]! p-6 transition-all duration-300 bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-[#e8f4fd]">
                  <span className="text-[24px]! text-[#006694]">
                    <AccessTimeIcon />
                  </span>
                </div>
                <h3
                  className="text-[#003366] mb-2"
                  style={{ fontSize: "1.1rem", fontWeight: 700 }}
                >
                  24/7 Emergency &amp; Online Booking
                </h3>
                <p
                  className="text-gray-500 leading-relaxed"
                  style={{ fontSize: "0.75rem" }}
                >
                  Dental emergencies don&apos;t wait — neither do we. Book
                  appointments online anytime, or call for same-day emergency
                  consultations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Speaks */}
      <section className="py-[48px] md:py-[64px] bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h2
            className="text-[#003366] text-center mb-2"
            style={{ fontSize: "2rem", fontWeight: 800 }}
          >
            What Our Patients Say
          </h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto text-base">
            Real stories from real patients
          </p>

          <div className="relative">
            {/* Prev / Next arrow controls */}
            <button
              ref={reviewsPrevRef}
              type="button"
              aria-label="Previous"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#003366] transition-colors duration-200 hover:bg-gray-50 -ml-1 md:-ml-3"
            >
              <ChevronLeftIcon />
            </button>
            <button
              ref={reviewsNextRef}
              type="button"
              aria-label="Next"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#003366] transition-colors duration-200 hover:bg-gray-50 -mr-1 md:-mr-3"
            >
              <ChevronRightIcon />
            </button>

            <Swiper
              modules={[Navigation, Autoplay]}
              speed={600}
              loop={false}
              spaceBetween={16}
              slidesPerView={1.2}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                prevEl: reviewsPrevRef.current,
                nextEl: reviewsNextRef.current,
              }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = reviewsPrevRef.current;
                swiper.params.navigation.nextEl = reviewsNextRef.current;
              }}
              breakpoints={{
                768: { slidesPerView: 2.5 },
                1024: { slidesPerView: 4 },
              }}
              className="px-1 pt-2 pb-4 overflow-visible"
            >
              {patientSpeaks.map((p, i) => (
                <SwiperSlide key={i} className="h-auto overflow-visible">
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                    {/* Inline video player (portrait 9:16 reel) */}
                    <div className="relative w-full aspect-[9/16] bg-black">
                      <video
                        src={p.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        style={{ background: "#000" }}
                        className="absolute inset-0 w-full h-full object-cover"
                        onLoadedMetadata={(e) => {
                          try {
                            const video = e.currentTarget;
                            const seekTo = Math.min(2, video.duration * 0.9);
                            if (seekTo > 0 && isFinite(seekTo)) {
                              video.currentTime = seekTo;
                            }
                          } catch (_) {
                            // seek failed — leave at frame 0
                          }
                        }}
                      />
                    </div>

                    {/* Card body — name + badge on one line */}
                    <div className="p-4 flex items-center justify-between gap-2">
                      <p className="text-[#1a1a1a] text-base font-semibold leading-tight">
                        {p.name}
                      </p>
                      <span className="inline-block bg-orange-50 text-[#F57C00] rounded-full px-3 py-1 text-[12px] font-semibold whitespace-nowrap">
                        {p.treatment}
                      </span>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Meet Our Doctors */}
      <section className="py-[48px] md:py-[64px] bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h2
            className="text-[#003366] text-center mb-2"
            style={{ fontSize: "2rem", fontWeight: 800 }}
          >
            Our Team of Dental Experts
          </h2>
          <p
            className="text-center text-gray-500 mb-10 max-w-2xl mx-auto"
            style={{ fontSize: "1rem" }}
          >
            Skilled. Certified. Compassionate. Our expert team is what makes
            Dental Clinic trusted by thousands.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <div className="flex items-center gap-4 bg-white rounded-[8px] border border-gray-200 p-4">
              <span className="w-12 h-12 rounded-full bg-[#e8f4fd] flex items-center justify-center shrink-0">
                <GroupsIcon className="text-[#006694]" />
              </span>
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  <span className="font-numbers text-[#e88a1a]">4</span> Specialists
                </p>
                <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
                  Expert dental care across multiple specializations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white rounded-[8px] border border-gray-200 p-4">
              <span className="w-12 h-12 rounded-full bg-[#e8f4fd] flex items-center justify-center shrink-0">
                <WorkspacePremiumIcon className="text-[#006694]" />
              </span>
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  <span className="font-numbers text-[#e88a1a]">15+</span> Years Avg. Experience
                </p>
                <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
                  Over fifteen years of combined clinical expertise.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white rounded-[8px] border border-gray-200 p-4">
              <span className="w-12 h-12 rounded-full bg-[#e8f4fd] flex items-center justify-center shrink-0">
                <SchoolIcon className="text-[#006694]" />
              </span>
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  <span className="text-[#e88a1a]">MDS</span> Doctors
                </p>
                <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
                  Advanced care in oral surgery, orthodontics & more.
                </p>
              </div>
            </div>
          </div>

          {/* Doctor slider: 1.2 cards on mobile (peek next), 2.5 on tablet,
              all 4 on desktop. Swipeable; arrows appear on hover (desktop). */}
          <div className="group relative max-w-6xl mx-auto">
            {/* Hover arrows (desktop only) */}
            <button
              ref={doctorsPrevRef}
              aria-label="Previous doctors"
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white text-[#003366] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeftIcon />
            </button>
            <button
              ref={doctorsNextRef}
              aria-label="Next doctors"
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white text-[#003366] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRightIcon />
            </button>

            <Swiper
              modules={[Navigation]}
              speed={1000}
              loop={true}
              spaceBetween={16}
              slidesPerView={1.2}
              navigation={{
                prevEl: doctorsPrevRef.current,
                nextEl: doctorsNextRef.current,
              }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = doctorsPrevRef.current;
                swiper.params.navigation.nextEl = doctorsNextRef.current;
              }}
              breakpoints={{
                768: { slidesPerView: 2.5 },
                1024: { slidesPerView: 4.5 },
              }}
              className="px-1 pt-2 pb-4 doctors-swiper"
            >
              {doctors.map((doc) => {
                const CardTag = doc.to ? Link : "div";
                return (
                <SwiperSlide key={doc.name} className="h-auto">
                  <CardTag
                    {...(doc.to ? { to: doc.to } : {})}
                    className={`block no-underline h-full bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${
                      doc.lead ? "border-t-4 border-[#e88a1a]" : ""
                    }`}
                  >
                    {/* Photo (4:5) — real image on top, navy gradient + silhouette
                        as the fallback layer if no/broken image. */}
                    <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-[#0D1B4A] to-[#1e3a8a]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PersonIcon className="text-white/80 text-[64px]!" />
                      </div>
                      {doc.img && (
                        <img
                          src={doc.img}
                          alt={doc.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover object-top"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[#003366] text-base font-semibold leading-tight">
                        {doc.name}
                      </p>
                      {doc.subtitle && (
                        <p className="text-gray-500 text-[12px] mt-1 leading-snug">
                          {doc.subtitle}
                        </p>
                      )}
                      <p className="font-numbers text-gray-500 text-[12px] mt-1">{doc.experience}</p>
                    </div>
                  </CardTag>
                </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Dental Health Plans */}
      <MembershipPlansSection />

      {/* FAQ */}
      <section className="py-[48px] md:py-[64px] bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h2
            className="text-[#003366] text-center mb-2"
            style={{ fontSize: "2rem", fontWeight: 800 }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto text-base">
            Everything you need to know about our dental care
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto items-start">
            {faqs.map((item, i) => {
              const open = !!openFaqs[i];
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 px-6 py-4"
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenFaqs((prev) => ({ ...prev, [i]: !prev[i] }))
                    }
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-[#003366] text-[15px] md:text-base font-semibold leading-snug">
                      {item.q}
                    </span>
                    <AddIcon
                      className={`text-[#003366] shrink-0 transition-transform duration-300 ${
                        open ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      open
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="text-gray-600 text-[15px]"
                        style={{ lineHeight: 1.7 }}
                      >
                        {item.a}
                      </p>
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
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
