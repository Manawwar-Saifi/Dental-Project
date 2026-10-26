import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "laser-dentistry", label: "LASER DENTISTRY" },
  { id: "laser-vs-general", label: "LASER DENTISTRY VS GENERAL DENTISTRY IS LASER DENTISTRY BETTER?" },
  { id: "advantages", label: "WHAT ARE THE DIFFERENT ADVANTAGES OF LASER DENTISTRY OVER TRADITIONAL DENTAL TREATMENTS?" },
  { id: "how-laser-used", label: "HOW IS LASER USED IN DENTISTRY?" },
  { id: "classification", label: "CLASSIFICATION OF LASER IN DENTISTRY" },
  { id: "classification-tissue", label: "CLASSIFICATION OF LASER IN DENTISTRY ACCORDING TO TISSUE" },
  { id: "classification-treatment", label: "CLASSIFICATION ACCORDING TO VARIOUS LASER TREATMENT FOR TEETH" },
  { id: "cost", label: "LASER DENTISTRY COST AT 2HF CLINICS" },
  { id: "courses", label: "LASER DENTISTRY COURSES" },
  { id: "faqs", label: "LASER DENTISTRY FAQS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const LaserDentistryPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", treatment: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  return (
    <>
      <BreadcrumbBanner />

      {/* Section Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ borderLeft: "4px solid #C8A951" }}>
          <span className="flex items-center gap-1 shrink-0" style={{ fontSize: "20px", fontWeight: 800, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Laser Dentistry <span style={{ fontSize: "14px" }}>&#8599;</span>
          </span>
          {navSections.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleScrollTo(s.id); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleScrollTo(s.id); }}
              className="bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 cursor-pointer select-none hover:bg-[#003366] hover:text-white hover:border-[#003366] transition-all"
              style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section - Image + Enquiry Form */}
      <div className="bg-white pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8">
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#e8e8e8] p-4">
                <img
                  src="/images/laser-dentistry.png"
                  alt="Laser Dentistry"
                  className="w-full h-auto object-contain rounded-xl"
                  style={{ maxHeight: "450px" }}
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-8 bg-[#003366] rounded-full"></div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#003366", margin: 0, fontFamily: "'Poppins', sans-serif" }}>
                    Enquiry Now
                  </h2>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder={NAME_PLACEHOLDER} value={form.name} onChange={(e) => setForm({ ...form, name: filterName(e.target.value) })} className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors" style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }} />
                  <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors" style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }} />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors" style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }} />
                  <select value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors text-gray-500" style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }}>
                    <option value="">Select Treatment</option>
                    <option value="dental-implant">Dental Implant</option>
                    <option value="root-canal">Root Canal Treatment</option>
                    <option value="braces">Braces</option>
                    <option value="teeth-whitening">Teeth Whitening</option>
                    <option value="clear-aligners">Clear Aligners</option>
                    <option value="dental-crowns">Dental Crowns & Bridges</option>
                    <option value="laser-dentistry">Laser Dentistry</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="flex justify-center" style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                    <ReCAPTCHA ref={captchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={(token) => setCaptchaToken(token)} onExpired={() => setCaptchaToken(null)} />
                  </div>
                  <button type="button" onClick={async () => { if (!captchaToken) { toast.warn("Please complete the reCAPTCHA verification."); return; } const ok = await submitEnquiry({ name: form.name, email: form.email, phone: form.phone, treatment: form.treatment, pagePath: window.location.pathname, pageLabel: "Treatment Page" }); if (ok) { setForm({ name: "", email: "", phone: "", treatment: "" }); setCaptchaToken(null); captchaRef.current?.reset(); } }} className="w-full py-3 bg-[#003366] text-white rounded-full uppercase tracking-wide cursor-pointer hover:bg-[#004080] transition-colors" style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>

        {/* Section 1: Laser Dentistry */}
        <Box id="laser-dentistry" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Laser Dentistry
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            LASER stands for Light Amplification by the Stimulated Emission of Radiation. The instrument creates light energy in a very narrow and focused beam. This laser light produces a reaction when it hits tissue, allowing it to remove or shape the tissue. Lasers can make dental treatments more efficient, cost-effective, and comfortable for the patient.
          </Typography>
        </Box>

        {/* Section 2: Laser Dentistry vs General Dentistry */}
        <Box id="laser-vs-general" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Laser Dentistry Vs General Dentistry Is Laser Dentistry Better?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Laser dentistry provides patients with a better experience and quality. Even though laser dentistry is mainly associated with cosmetic treatments, it is equally effective for preventative purposes. It potentially offers a more comfortable treatment option for a number of dental procedures involving hard or soft tissues compared to drills and other non-laser tools.
          </Typography>
        </Box>

        {/* Section 3: Advantages (gray bg) */}
        <Box id="advantages" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                What Are The Different Advantages Of Laser Dentistry Over Traditional Dental Treatments?
              </Typography>
            </div>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <span style={{ fontWeight: 700, color: "#333", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Pain:</span>{" "}
                <span style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>When it comes to pain,regular dentistry procedures tend to cause discomfort as compared to lasers. Regular Dental instruments cause vibrations, which may be painful to some patients. To remove discomfort and ease the pain, anaesthesia injections are used. On the other hand, laser dentistry is pain-free. It is fast and effective as it uses light and heat to perform a wide range of dental treatments.</span>
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <span style={{ fontWeight: 700, color: "#333", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Dental Bleeding:</span>{" "}
                <span style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Your oral health is pretty important. So, when you opt to have a dental treatment, it might cause bleeding during treatments and discomfort.. But if you opt for laser dentistry, there is no Dental Bleeding since the laser promotes immediate blood clotting by sealing blood vessels. Swelling is also negligible when using lasers.</span>
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <span style={{ fontWeight: 700, color: "#333", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Recovery:</span>{" "}
                <span style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>When it comes to recovery, it may take time to heal, making the tissue regeneration slower. For instance, if you want to remove one of your wisdom teeth, your gums are cut open to extract the tooth. This, in all probability, will leave you with a wound that will need time to heal. In laser dentistry, tissue can regenerate faster, and minor wounds heal more quickly.</span>
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <span style={{ fontWeight: 700, color: "#333", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Bacterial Infections:</span>{" "}
                <span style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Dental problems are mostly due to underlying bacterial infections of the teeth and Gums. Most common problems like Gum bleeding or pain in tooth are because of Bacterial infections of Gums causing Gingivitis and Infection of the pulp of a tooth due to Dental Caries. With a regular dental treatment, to resolve these chronic infections takes time and multiple appointments and dressings and re dressings. The Benefit of using a Laser for such procedures is that Laser sterilises the infected area with Heat and hence more accurately removes the Bacterial infections and hence gives better postoperative results.</span>
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 4: How Is Laser Used In Dentistry? */}
        <Box id="how-laser-used" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              How Is Laser Used In Dentistry?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            All lasers work by delivering energy in the form of light. When used for dental procedures, the laser acts as a cutting instrument or a vaporiser of the tissue that it comes in contact with. When used in teeth-whitening procedures, the laser acts as a heat source and enhances the effect of tooth-bleaching agents.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Instead of needles and drills, laser dentistry uses Heat and light to treat Dental infections. That's why the procedure is less painful.
          </Typography>
        </Box>

        {/* Section 5: Classification of Laser in Dentistry */}
        <Box id="classification" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Classification Of Laser In Dentistry
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The word LASER is an abbreviation for Light Amplification by Stimulated Emission of radiation. The concept of lasers is based on Einstein's theory of stimulated emission. Lasers are used in a wide range of medical and cosmetic procedures. Recently it has received attention in clinical dental settings. With minimal anaesthesia, lasers ablate the hard tissues. Bacterial counts in root canals are also reduced with the help of laser treatment. There are different ways by which lasers are used in dentistry. During surgical procedures of soft tissues, good hemostasis can also be achieved with their use. The most common types are carbon dioxide (CO2), diode, neodymium: yttrium– aluminum–garnet (Nd: YAG), and erbium: yttrium–aluminum–garnet (Er: YAG) lasers. They are used for cavity preparation, tooth whitening, gingival incisions, and other applications.
          </Typography>
        </Box>

        {/* Section 6: Classification According to Tissue (gray bg) */}
        <Box id="classification-tissue" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Classification Of Laser In Dentistry According To Tissue
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Lasers are categorized by various methods, however broadly, they are classified into two categories – hard or soft tissue lasers. This is because some are too abrasive for soft tissue while others aren't abrasive enough for hard tissue. Some can be used interchangeably if their wavelength allows it.
            </Typography>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>
              Hard Tissue Lasers in Dentistry
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The essential use of this laser is to cut the teeth with exact precision. It cuts into the teeth and bones with accuracy. This laser treatment is perfect during the cutting of the tooth structure.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The wavelength from the intricate tissue laser is highly absorbable by hydroxyapatite. Besides, the lasers include Erbium Chromium YSGG and Erbium YAG. Hard tissue laser also helps in preparing or shaping the teeth with composite bonding. It helps in the removal of small tooth structures and the healing of dental tear fillings.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Some common hard tissue procedures include:
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc", marginBottom: "20px" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Cavity detection</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Dental fillings and tooth preparations</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Treating tooth sensitivity</li>
            </ul>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>
              Dental Soft Tissue Laser Procedures
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Soft tissue lasers can highly absorb water and haemoglobin, making them suitable to treat problems in the soft tissue. Likewise, the soft tissue lasers include Neodymium YAG with diode lasers. It helps in killing the bacteria in the mouth and helps reactivate the growth of the tissues.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Some common soft tissue procedures include:
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Treating gummy smiles</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Crown lengthening</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Treating tongue frenulum attachment</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Removal of soft tissue folds</li>
            </ul>
          </div>
        </Box>

        {/* Section 7: Classification According to Various Laser Treatment */}
        <Box id="classification-treatment" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Classification According To Various Laser Treatment For Teeth
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            You must be curious about what laser dentistry is used for. Well, there are a lot of dental treatments that are being replaced by pain-free laser dental treatments like:
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Removing benign tumours
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Lasers can remove tumours from the palate, gums, and sides of the lips and cheeks through pain- and suture-free methods.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Dental fillings
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Local anaesthesia and traditional drills are often not needed with laser treatments. Lasers can kill bacteria in a cavity, which can aid in the long-term health of a tooth.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Treating tooth sensitivity
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Teeth that have sensitivity to hot and cold can be treated with dental lasers that seal tubules on the tooth's root.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Treating a "gummy smile"
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Lasers are used to reshape gum tissue associated with a "gummy smile" in which the gums' length covers much of the tooth.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Crown lengthening
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This procedure reshapes both gum tissue and bone for healthier tooth structure, which helps with placing restorations on the teeth.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Treating tongue frenulum attachment
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Those with a thick or tight frenulum (the fold of skin under the front part of the tongue that anchors to the mouth floor) may benefit from a laser frenectomy. This treatment helps children whose restricted frenulum causes them to be tongue-tied, have difficulty breastfeeding, or have a speech impediment.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Removing soft tissue folds
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Lasers can remove soft tissue folds from ill-fitting dentures without pain or sutures.
          </Typography>
        </Box>

        {/* Section 8: Laser Dentistry Cost at 2HF Clinics */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Laser Dentistry Cost At 2HF Clinics
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Different laser treatments require different processes and approaches. It depends from case to case and patient to patient, how much the cost will be.
          </Typography>
        </Box>

        {/* Section 9: Laser Dentistry Courses */}
        <Box id="courses" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Laser Dentistry Courses
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Our training vertical will start soon. Till then, you can join us as a trainee to learn various dentistry-related practices.
          </Typography>
        </Box>

        {/* Section 10: Laser Dentistry FAQs (gray bg) */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Laser Dentistry FAQs
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. What Is Laser Dentistry Used For?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                To be specific, laser dentistry refers to light energy that is a thin beam of extremely focused light, exposed to a particular tissue so that it can be moulded or eliminated from the mouth. Throughout the world, laser dentistry is being used for conducting numerous treatments, ranging from simple procedures to rather complex dental procedures. Some of the most common treatments that are done with laser dentistry are:
              </Typography>
              <ul style={{ marginLeft: "20px", listStyleType: "disc", marginTop: "8px" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Teeth whitening</li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Treatment of gum diseases</li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Treatment of tooth decay</li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Treatment of hypersensitivity</li>
              </ul>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. How Does Laser Dentistry Work?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Laser Dentistry is the way of the future. Based on modern medical science, a laser is a device that emits a narrow and very intense beam of light that neither diffuses nor spreads out. When focused at close range, these beams act on the tissue. Laser dentistry employs this beam to shape or even remove soft or hard tissue.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Is Laser Dentistry Better?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Laser dentistry can fix cavities without all the painful stuff. Just imagine getting rid of that toothache and not hearing the sound of a drill in your sleep for weeks afterward. It's not just for cavities, either. Laser dentistry can treat anything from canker sores to gum disease. It's often a great option for kids too.
              </Typography>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default LaserDentistryPage;
