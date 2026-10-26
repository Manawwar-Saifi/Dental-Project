import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-mouth-ulcers", label: "WHAT ARE MOUTH ULCERS?" },
  { id: "causes", label: "CAUSES OF MOUTH ULCERS" },
  { id: "treatment", label: "TREATMENT OF MOUTH ULCERS" },
  { id: "how-to-avoid", label: "HOW TO AVOID MOUTH ULCER?" },
  { id: "types", label: "TYPES OF MOUTH ULCERS" },
  { id: "charges", label: "WHAT ARE THE CHARGES FOR MOUTH ULCER TREATMENT?" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const MouthUlcersPage = () => {
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
            Mouth Ulcers <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/mouth-ulcers.png"
                  alt="Mouth Ulcers"
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
                    <option value="mouth-ulcers">Mouth Ulcers</option>
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
              Mouth Ulcers
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Mouth Ulcers commonly known as canker sores are painful lesions in the mouth or at the base of the gums or inside cheeks or lips. In scientific terms, it is the loss of tissue lining in the mouth. These are nothing to worry about as they are non-contagious and go away in around a week or two.
          </Typography>
        </Box>

        {/* Section 1: What Are Mouth Ulcers? */}
        <Box id="what-are-mouth-ulcers" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Mouth Ulcers?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Mouth Ulcers commonly known as canker sores are painful lesions in the mouth or at the base of the gums or inside cheeks or lips. In scientific terms, it is the loss of tissue lining in the mouth. These are nothing to worry about as they are non-contagious and go away in around a week or two. However, if these are not healed in the period as said so or are large and extremely painful then it is advised to visit a dentist. The pain sometimes can be to the extent that it can make eating, talking and drinking difficult and uncomfortable.
          </Typography>
        </Box>

        {/* Section 2: Causes of Mouth Ulcers */}
        <Box id="causes" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Causes Of Mouth Ulcers
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Women, children and the one having a family history are most prone to developing Mouth Ulcers. Though the exact cause of Mouth Ulcers could not be known several factors can attribute to the same:
          </Typography>
          <ul className="ml-5 list-disc">
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Trauma or Injury from hard brushing, sports injury accidents or dental work
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Bacterial or Fungal infections
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Stress can also be a reason and is most common in teens
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Intake of acidic food or drinks
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Hormonal changes
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Mouth rinses which contain sodium lauryl sulphate.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Lack of vitamins such as B-12, zinc, folate, and iron
            </li>
          </ul>
        </Box>

        {/* Section 3: Treatment of Mouth Ulcers */}
        <Box id="treatment" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Treatment Of Mouth Ulcers
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Mouth Ulcers do not need treatment as they go away with time. But if the ulcers are large and extremely painful, please visit your dentist for treatment options:
            </Typography>
            <ul className="ml-5 list-disc">
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Rinse with salt water and baking soda
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Apply pain relief ointments like Dologel CT
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Apply ice to canker sores or use cold water
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Placing old tea bags on the sores
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Drink cool chamomile tea
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Milk of magnesia can also be a good option and is advised to place on Mouth Ulcers
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 4: How To Avoid Mouth Ulcer? */}
        <Box id="how-to-avoid" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              How To Avoid Mouth Ulcer?
            </Typography>
          </div>
          <ul className="ml-5 list-disc">
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Eat a healthy and balanced diet
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Avoid spicy and acidic food and beverage
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Brush gently
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Drink plenty of water
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Adopt means to reduce stress
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Have a proper sleep
            </li>
          </ul>
        </Box>

        {/* Section 5: Types of Mouth Ulcers */}
        <Box id="types" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Types Of Mouth Ulcers
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The uncomfortable and painful sores can be of various types. The most common amongst these are:
          </Typography>
          <ul className="ml-5 list-disc">
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ color: "#333" }}>Canker Sores</strong><br />
              These are small white patches with red borders. Being non-contagious the reason or cause is unknown but usually, trauma is the most common reason. They heal on their own with the time that might take a week and a half. Spicy, acidic and citrus food should be avoided.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ color: "#333" }}>Cold Sores</strong><br />
              These appear in a cluster of red, raised blisters outside mouth especially lips. These are filled with fluid which can break making fluid to leak. Though they are highly contagious, yet they heal on their own in an about a week.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ color: "#333" }}>Candidiasis</strong><br />
              It is a yeast infection which appears inside the mouth on soft and moist tissue. It appears as a white patch with a red base. The cause of developing such sore is fungus and people with a weak immune system or people with poor health or diabetic patients are more prone to these sores. If the case of sore is candidiasis, then one should seek advice from Dental Professional.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ color: "#333" }}>Leucoplakia</strong><br />
              These are tough white patches which appear anywhere in the mouth. Though these are not painful or contagious but can have more serious concerns. Therefore, it is advised to visit a Dental Professional in this case.
            </li>
          </ul>
        </Box>

        {/* Section 6: Charges */}
        <Box id="charges" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are The Charges For Mouth Ulcer Treatment?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Mouth ulcers need to be treated at their early stages so as to avoid any extra expenses that might incur later if the situation is neglected. For the best prices, you need to contact your nearest 2HF Dental clinic in India.
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
                Q.1. Do Mouth Ulcers Lead to Oral Cancer?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Yes, sore mouth ulcers, which do not heal naturally and last for several weeks, can lead to oral cancer. Mouth ulcers can occur anywhere in the mouth but the once that develop under the tongue are particularly alarming. Book an Appointment for such cancer-related ulcer alarms.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. How Are Mouth Sores Treated?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Mouth sores can be easily treated at home by rinsing the mouth regularly with warm salt water, drinking plenty of fluids, avoiding spicy food and applying an antiseptic gel to the ulcers. Usually, mouth ulcers heal within a week. In case they don't, consider visiting your nearest dentist.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. How Long Does It Take to Heal Ulcers?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Mouth ulcers usually selfheal within one to two weeks. However, serious and painful ulcers can take up to 6 weeks to heal. If you are prone to mouth ulcers, visit the best dental care near you for immediate relief from painful canker sores.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Can One Apply Toothpaste to Ulcers?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Generally, toothpaste can help to treat mouth ulcers. However, for people who are prone to mouth ulcers, toothpaste with high SLS (Sodium lauryl sulphate) may even aggravate ulcers. Hence, it is best to seek advice from a dentist nearby for ulcers that are painful and not self-healing.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.5. How Can You Get Rid of Mouth Ulcers Permanently?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                A healthy diet and strict oral hygiene are the secrets to an ulcer free mouth. Mouth ulcers can be caused due to underlying health reasons like Vitamin B12 deficiency and iron deficiency too. Patients prone to mouth ulcers must consult the best dentist near them for a permanent solution.
              </Typography>
            </Box>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default MouthUlcersPage;
