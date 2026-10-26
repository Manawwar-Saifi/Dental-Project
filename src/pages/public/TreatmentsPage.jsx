import { Link } from "react-router-dom";
import BreadcrumbBanner from "../../components/public/BreadcrumbBanner";
import treatmentsData from "../../data/treatmentsData";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import HealingIcon from "@mui/icons-material/Healing";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import StraightenIcon from "@mui/icons-material/Straighten";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import BoltIcon from "@mui/icons-material/Bolt";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import DiamondIcon from "@mui/icons-material/Diamond";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import BuildIcon from "@mui/icons-material/Build";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import GridOnIcon from "@mui/icons-material/GridOn";
import TagFacesIcon from "@mui/icons-material/TagFaces";
import FavoriteIcon from "@mui/icons-material/Favorite";

// Slug → MUI icon component. Every treatment gets a distinct glyph.
// FavoriteIcon is the neutral fallback for any future treatment not listed here.
const TREATMENT_ICONS = {
  "dental-implant": MedicalServicesIcon,
  "root-canal-treatment-rct": HealingIcon,
  "wisdom-teeth": LocalHospitalIcon,
  "clear-aligners": StraightenIcon,
  "cosmatic-dental-bonding": ColorLensIcon,
  "laser-dentistry": BoltIcon,
  "kids-dentistry": FamilyRestroomIcon,
  "dental-crowns-and-bridges": DiamondIcon,
  "gum-disease-treatment": HealthAndSafetyIcon,
  "dental-filling": BuildIcon,
  "dentures": SentimentSatisfiedIcon,
  "teeth-whitening": AutoAwesomeIcon,
  "mouth-ulcers": LocalPharmacyIcon,
  "braces": GridOnIcon,
  "smile-makeover": TagFacesIcon,
};

const DEFAULT_ICON = FavoriteIcon;

const treatments = Object.entries(treatmentsData).map(([slug, data]) => ({
  slug,
  title: data.title,
  content: data.content,
}));

const TreatmentsPage = () => {
  return (
    <>
      <title>Dental Treatments in Sonipat | Dental Clinic</title>
      <meta
        name="description"
        content="15+ dental treatments including implants, RCT, braces, aligners, whitening, laser dentistry, kids dentistry. Painless procedures with modern equipment."
      />
      <meta
        name="keywords"
        content="dental treatments Sonipat, dental implants Sonipat, root canal Sonipat, braces Sonipat, Dental Clinic treatments"
      />
      <link rel="canonical" href="https://dentalclinic.example.com/treatments" />
      <meta name="robots" content="index, follow" />
      <meta
        property="og:title"
        content="Dental Treatments in Sonipat | Dental Clinic"
      />
      <meta
        property="og:description"
        content="15+ dental treatments including implants, RCT, braces, aligners, whitening, laser dentistry, kids dentistry. Painless procedures with modern equipment."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/treatments" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Dental Treatments in Sonipat | Dental Clinic" />
      <meta
        name="twitter:description"
        content="15+ dental treatments including implants, RCT, braces, aligners, whitening, laser dentistry, kids dentistry."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: treatments.map((t, i) => ({
              "@type": "MedicalProcedure",
              position: i + 1,
              name: t.title,
              url: `https://dentalclinic.example.com/treatments/${t.slug}`,
            })),
          }),
        }}
      />
      <BreadcrumbBanner
        title="Our Treatments"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Treatments" },
        ]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-[#003366] text-center mb-3"
            style={{ fontSize: "2rem", fontWeight: 800 }}
          >
            All Dental Treatments
          </h2>
          <p
            className="text-center text-gray-500 mb-12 max-w-3xl mx-auto"
            style={{ fontSize: "1rem" }}
          >
            Explore our comprehensive range of dental treatments. Click on any treatment to learn more about the procedure, benefits, and FAQs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {treatments.map((t) => {
              const IconComponent = TREATMENT_ICONS[t.slug] ?? DEFAULT_ICON;
              return (
                <Link
                  key={t.slug}
                  to={`/treatments/${t.slug}`}
                  className="group flex flex-col items-center text-center p-6 rounded-2xl border border-gray-200 no-underline cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-[#006694] hover:-translate-y-1"
                >
                  <div className="w-20 h-20 rounded-full bg-[#e8f4fd] flex items-center justify-center mb-4 overflow-hidden group-hover:bg-[#006694] transition-colors duration-300">
                    <IconComponent
                      sx={{ fontSize: 40 }}
                      className="text-[#006694] group-hover:text-white transition-colors duration-300"
                    />
                  </div>
                  <h3
                    className="text-[#003366] group-hover:text-[#006694] transition-colors duration-200 mb-2"
                    style={{ fontSize: "1.05rem", fontWeight: 700 }}
                  >
                    {t.title}
                  </h3>
                  <p
                    className="text-gray-500 leading-relaxed line-clamp-3"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {t.content}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default TreatmentsPage;
