import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-is-smile-makeover", label: "WHAT IS SMILE MAKEOVER?" },
  { id: "procedures", label: "PROCEDURES INVOLVED IN SMILE MAKEOVER" },
  { id: "why-opt", label: "WHY SHOULD ONE OPT FOR GETTING SMILE MAKEOVER" },
  { id: "precautions", label: "WHAT ARE THE PRECAUTIONS TO BE TAKEN" },
  { id: "post-care", label: "POST TREATMENT CARE" },
  { id: "prices", label: "SMILE MAKEOVER PRICES" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const SmileMakeoverPage = () => {
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
            Smile Makeover <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/smile-makeover.png"
                  alt="Smile Makeover"
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
                    <option value="smile-makeover">Smile Makeover</option>
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

        {/* Section 1: What Is Smile Makeover? */}
        <Box id="what-is-smile-makeover" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is Smile Makeover?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The smile is a reflection of one's oral health! For a smile -makeover beautifully aligned teeth with healthy gum is an absolute necessity.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Smile makeover takes into consideration the tooth colour, tooth size, tooth shape, tooth position, lip position, lip length, gum position, and gum colour. The change of one's smile involves re-alignment or veneering or change of shape or colour of teeth, so that the teeth fulfil the requirements of a beautiful smile
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Tooth Colour
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Bright and white teeth are a sign of youthful appearance. The dentist will match the colour of the teeth with skin tone, skin colour, and hair colour. He can change the colour of the teeth by Bleaching or Veneers.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The line from incisal edges of upper teeth from side to side should follow the contour of the lower lip for an aesthetic appearance.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Tooth Size/Shape
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            As the age increases the teeth become shorter due to attrition. Long teeth give a young look. Some teeth are slightly abnormal in shape as compared to adjacent teeth e.g., Peg laterals which give an unesthetic appearance. The size and shape of the teeth can be changed by veneers or crowns. The white show (tooth show) can also be increased by procedures like crown lengthening or changing the gum line (in cases of a gummy smile) by the help of laser dentistry. The width to length ratio of the upper central incisors should be 4-5 for a balanced smile line.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Tooth Position
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Crooked, crowded or spacing between teeth can be corrected by using Braces, Aligners or Veneers.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Missing Teeth
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Missing teeth can be replaced by using Bridges, Implants or other Removable Prosthesis.
          </Typography>
        </Box>

        {/* Section 2: Procedures Involved In Smile Makeover */}
        <Box id="procedures" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Procedures Involved In Smile Makeover
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The procedures involved in smile makeover can be mix of
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Veneers/Crowns
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Veneers are thin tooth-coloured custom-made shells that are fixed on the labial surface of teeth to change their colour, shape, and size. These improve the appearance of front teeth. Crowns are also tooth-coloured custom-made shells but they cover the full surface of the tooth. They also make the tooth stronger.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Teeth Whitening
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Teeth whitening is a process of removing stains from the tooth surface and restoring the natural colour of the teeth. Whitening is a one-time procedure performed by a dentist. It is amongst the most common and widely adopted cosmetic procedure.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Composite Bonding
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Permanently attaching a tooth-coloured material (composite) onto the tooth is called composite bonding. This can be Direct or Indirect. Direct composite bonding can be used by dentists on the chair to do fillings, repair fractured edges and close gaps. Indirect bonding is usually done in the lab.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Dental Implants
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental implant are root-like titanium screws which are surgically placed in the jaw bone for replacement of missing teeth. It greatly increases the self-esteem of the patient as it closely simulates the natural tooth. It does not cause any speech difficulty and has high acceptability.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Orthodontic Treatment
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Orthodontic treatment is a way of straightening teeth to make them look more aesthetic and improve function. The treatment can be done by braces and aligners (Invisible Braces). There are tooth-coloured braces, metal braces, and lingual braces. The treatment usually takes 12-18 months to complete but is more stable and long lasting as it preserves the natural integrity of teeth.
          </Typography>
        </Box>

        {/* Section 3: Why Should One Opt For Getting Smile Makeover */}
        <Box id="why-opt" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Why Should One Opt For Getting Smile Makeover
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Smile Makeover is a boon in dentistry as it makes the patient look more aesthetically acceptable in society. It remarkably increases the self-confidence and self-esteem in patients. It also contributes to better function helping patients to lead a more comfortable lifestyle.
            </Typography>
          </div>
        </Box>

        {/* Section 4: What Are The Precautions To Be Taken */}
        <Box id="precautions" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are The Precautions To Be Taken
            </Typography>
          </div>
          <ul className="ml-5 list-disc">
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Veneers need to be replaced in case they break or chip off. The patients are advised not to eat hard food when they are wearing veneers.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Crowns usually require replacement after 10-15 years.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Composite bonding can get stained or can break and would need replacement.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Implants have to be kept for 3-4 months before loading it with the crown and have to be checked for osseointegration.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Patient has to be regular and cooperative during the complete orthodontic treatment.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              In addition, depending upon the treatment mix always consult your dentist for doubts.
            </li>
          </ul>
        </Box>

        {/* Section 5: Post Treatment Care */}
        <Box id="post-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Post Treatment Care
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Smile makeover requires regular maintenance of oral hygiene. The patient has to visit the dentist every 6 months for a checkup and any minor repairs.
          </Typography>
        </Box>

        {/* Section 6: Smile Makeover Prices */}
        <Box id="prices" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Smile Makeover Prices
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Depending on your dental health, the length of treatment and cost of your smile makeover will differ. If your dentist detects any underlying oral health concerns before commencing treatment, your Delaying gum problems not only affects oral health as a whole, it directly impacts overall health for instance, its directly related to increased risk of heart disease. However, if you are someone with immaculate oral health, then the charges become significantly reasonable.
          </Typography>
        </Box>

        {/* Section 7: FAQs */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. What Is the Cost of a Smile Makeover Procedure?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Smile Makeover is not just one procedure but a culmination of several different treatments. While some require a majority of them, others can need fewer procedures. Thus, smile makeover cost can vary from person to person, as it is a reflection of what exactly is needed.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. How To Get Perfect Teeth?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Getting perfect teeth is easy; you only need to take care of two things. First, follow all of the basic oral hygiene principles like brushing, flossing, and rinsing. Second, make sure that you visit a dental clinic at least twice every year for dental check-ups. For dental check-ups and consultation.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. Can One Get Their Teeth Fixed Without Braces?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                With technology covering larger leaps than before, getting straighter teeth has become easier. There are a number of clear aligners and invisible braces that are available in the market and can straighten your teeth without letting others know that you are wearing any.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Can A Tooth Be Pushed Back into Its Place?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                In many situations, the tooth moves into place on its own. However, in some cases, experts at the dental clinic also have several ways to push the tooth back shall there be a need for it.
              </Typography>
            </Box>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default SmileMakeoverPage;
