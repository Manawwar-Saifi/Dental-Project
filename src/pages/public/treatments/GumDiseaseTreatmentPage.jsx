import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-gum-diseases", label: "WHAT ARE GUM DISEASES?" },
  { id: "causes", label: "CAUSES OF GUM DISEASE" },
  { id: "symptoms", label: "SYMPTOMS OF GUM DISEASES" },
  { id: "stages", label: "STAGES OR TYPES OF GUM DISEASE" },
  { id: "treatment-option", label: "TREATMENT OPTION OF GUM DISEASE" },
  { id: "prevention", label: "PREVENTION OF GUM DISEASE" },
  { id: "price", label: "PRICE FOR GUM DISEASE TREATMENT" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const GumDiseaseTreatmentPage = () => {
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
            Gum Disease Treatment <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/gum-deases-treatment.png"
                  alt="Gum Disease Treatment"
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
                    <option value="gum-disease">Gum Disease Treatment</option>
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

        {/* Intro */}
        <Box sx={{ mb: 5 }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Gum Disease Treatment
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Gum disease is an inflammation of the gum line that can progress to affect the bone that surrounds and supports your teeth.
          </Typography>
        </Box>

        {/* Section 1: What Are Gum Diseases? */}
        <Box id="what-are-gum-diseases" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Gum Diseases?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Gum disease is an inflammation of the gum line that can progress to affect the bone that surrounds and supports your teeth. Gum Disease also known as Periodontal Disease begins with bacterial growth in the mouth, the localized inflammation of the gingiva is initiated by bacteria in the dental plaque, which is a microbial biofilm that forms on the teeth and gingiva. Nearly 70% of the people are affected by this disease at some point in their life. Though such a prevalent disease most people are unaware of the issue and the problems it can cause.
          </Typography>
        </Box>

        {/* Section 2: Causes Of Gum Disease */}
        <Box id="causes" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Causes Of Gum Disease
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The primary cause of Gum Disease is poor oral hygiene. If you are not brushing or flossing properly, then the chances of bacteria build-up are high. However, there are other reasons as well such as:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Smoking or chewing tobacco which makes difficult for gum tissues to repair
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Consuming certain medications (oral contraceptive, steroids, anticonvulsants, calcium channel blockers, and chemotherapy) lessen saliva flow that protects teeth and gums. Some medicines even cause the abnormal growth of gum tissue.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Crooked or misaligned teeth
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Hormonal changes such as puberty, menstruation, menopause, pregnancy etc. can make your gums sensitive and as a result prone to gum diseases.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Certain illness such as cancer and HIV make your immune system weak are at higher risk of developing gum disease. Also, people who are diabetic are more prone to get Gum Disease.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Genetic susceptibility such as family history can contribute to gingivitis
            </li>
          </ul>
        </Box>

        {/* Section 3: Symptoms (gray bg) */}
        <Box id="symptoms" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Symptoms Of Gum Diseases
              </Typography>
            </div>
            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>
              DO's
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Bleeding of gums when you brush or floss your teeth</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Pulling of gums away from the teeth</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Teeth loosening</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Change in the way your teeth fit together when you bite (malocclusion)</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Pus between teeth and gums</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Pain while chewing</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Teeth sensitivity</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Tender, red or swollen gums</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Ill-fitting partial dentures</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Foul breath that doesn't go away even after brushing</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Deep space formation between gums and teeth</li>
            </ul>
          </div>
        </Box>

        {/* Section 4: Stages Or Types */}
        <Box id="stages" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Stages Or Types Of Gum Disease
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The stages of Gum Diseases are as follows:
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px", textTransform: "uppercase" }}>
            Gingivitis
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This is the first stage of gum disease, caused due to the plaque build-up on gums. If the plaque is not gone after brushing and flossing, then it can cause irritation. In this stage, you will notice your gums bleeding while brushing and flossing. Because bone is not affected in this stage, the chances of recovery are quite high.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px", textTransform: "uppercase" }}>
            Periodontitis
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Gingivitis if not treated on time, can lead to Periodontitis. This stage starts affecting your bone. Spaces are formed between bone and gum line as a result, bacteria will get a space food lodgement. If you visit your dentist on time then Periodontitis can be prevented. Periodontitis is an advanced gum disease.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px", textTransform: "uppercase" }}>
            Advanced Periodontitis
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This is the final stage of your gum disease where your bone is destroyed making your teeth loosen further. This can only be saved with surgery. And if the case is very advanced then even surgery cannot save your tooth, as a result, your dentist has to extract your tooth.
          </Typography>
        </Box>

        {/* Section 5: Treatment Option */}
        <Box id="treatment-option" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Treatment Option Of Gum Disease
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The treatment option depends on the stage of Gum Disease. It also depends on your medical history and your overall health. The treatment options range from non-surgical therapies to surgical treatments.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px", textDecoration: "underline" }}>
            The Non-Surgical Options Include:
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Deep Cleaning
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This is done in the very initial stage of developing a Gum Disease. Your dentist will remove the plaque or tartar (which hardens the tooth surface) from below and above the gum line. It is a preventive measure which helps you to save from getting gum disease.{" "}
            <span style={{ fontWeight: 700, fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Scaling & Root Planning</span>
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This is also a deep cleaning process. The only difference is that your dentist will give local anaesthesia to start the process. Plaque and tartar are removed from above and below the gum line and after that, the rough spots are made smooth. The process of smoothing helps to remove the bacteria. This is done only if your dentist finds that you have calculus deposits under the gum.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px", textDecoration: "underline" }}>
            Surgical Treatment Includes:
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Flap Surgery
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            In this, incision is made on the gums to remove the tartar. Sometimes the irregular surface of the bone is smoothened so that there are no areas for bacteria which cause this disease can hide. This method is used to remove the gap between gums and tooth.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Bone Graft
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This method is used to regenerate the bone. The dentist use fragments of synthetic bone donated bone or your own bone which is used to replace the bone destroyed due to gum disease
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Soft Tissue Graft
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This method is used if the gums are receded. Gums are taken from the roof of the mouth and is stitched to the area of gum recession.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Guided Tissue Regeneration
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Done along flap surgery when bone which supports your teeth are destroyed. Your dentist will insert a small piece of mesh-like fabric between your bone and gum tissue.
          </Typography>
        </Box>

        {/* Section 6: Prevention */}
        <Box id="prevention" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Prevention Of Gum Disease
            </Typography>
          </div>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Brush your teeth twice a day (with a fluoride toothpaste).
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Floss regularly to remove plaque from between teeth.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Visit your dentist after every 6 months for a routine check-up and professional cleaning.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Quit smoking
            </li>
          </ul>
        </Box>

        {/* Section 7: Price */}
        <Box id="price" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Price For Gum Disease Treatment
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The progression and the location of gum disease are the main factors responsible for the difference in price for its treatment. Delaying gum problems not only affects oral health as a whole, it directly impacts overall health for instance, its directly related to increased risk of heart disease. At 2HF Dental, in India, gum diseases are cured at competitive prices.
          </Typography>
        </Box>

        {/* Section 8: FAQs (gray bg) */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. Can Gum Disease Be Treated On Its Own?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                No, gum diseases cannot be treated on its own. Gum diseases are caused by the development of tartar on the teeth leading to gum infection. This requires dental cleaning and good oral care routine. Get professional cleaning at your nearest Clove Dental clinic.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. How Long Does It Take For Gum Disease To Be Cured?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Gum diseases are categorized into 4 stages, gingivitis, slight periodontal disease, moderate periodontal disease, and advanced periodontal disease. Curing gum diseases and gum infection depends on the stage at which treatment begins. The recovery time at stage one is 10-14 days.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. Is Gum Disease Treatable?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Yes, gum diseases are treatable. The recovery and treatment duration depends on the stage at which a gum infection is identified and preventive measures are taken.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. What Is The First Sign Of Gum Disease
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The first sign of gum disease is red, tender and swollen gums that cause discomfort and pain. Gums can also bleed while brushing, which is commonly considered as a sign of gingivitis-stage one of gum diseases.
              </Typography>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default GumDiseaseTreatmentPage;
