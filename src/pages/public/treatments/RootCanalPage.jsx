import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-is-rct", label: "WHAT IS ROOT CANAL TREATMENT?" },
  { id: "why-rct", label: "WHY DOES ONE NEED TO UNDERGO ROOT CANAL TREATMENT?" },
  { id: "symptoms", label: "SYMPTOMS" },
  { id: "consequences", label: "WHAT ARE THE CONSEQUENCES OF NOT GETTING A ROOT CANAL TREATMENT?" },
  { id: "procedure", label: "WHAT IS THE PROCEDURE FOR ROOT CANAL TREATMENT?" },
  { id: "post-care", label: "POST-TREATMENT CARE FOR ROOT CANAL TREATMENT" },
  { id: "price", label: "PRICE OF RCT IN INDIA" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const RootCanalPage = () => {
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
            Root Canal Treatment RCT <span style={{ fontSize: "14px" }}>&#8599;</span>
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
            {/* Image */}
            <div className="md:col-span-8">
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#e8e8e8] p-4">
                <img
                  src="/images/root-canal.png"
                  alt="Root Canal Treatment"
                  className="w-full h-auto object-contain rounded-xl"
                  style={{ maxHeight: "450px" }}
                />
              </div>
            </div>

            {/* Enquiry Form */}
            <div className="md:col-span-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-8 bg-[#003366] rounded-full"></div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#003366", margin: 0, fontFamily: "'Poppins', sans-serif" }}>
                    Enquiry Now
                  </h2>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={NAME_PLACEHOLDER}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: filterName(e.target.value) })}
                    className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors"
                    style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors"
                    style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors"
                    style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }}
                  />
                  <select
                    value={form.treatment}
                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                    className="w-full px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#003366] transition-colors text-gray-500"
                    style={{ fontSize: "16px", fontFamily: "'Poppins', sans-serif" }}
                  >
                    <option value="">Select Treatment</option>
                    <option value="dental-implant">Dental Implant</option>
                    <option value="root-canal">Root Canal Treatment</option>
                    <option value="braces">Braces</option>
                    <option value="teeth-whitening">Teeth Whitening</option>
                    <option value="clear-aligners">Clear Aligners</option>
                    <option value="dental-crowns">Dental Crowns & Bridges</option>
                    <option value="other">Other</option>
                  </select>
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
                    onClick={async () => { if (!captchaToken) { toast.warn("Please complete the reCAPTCHA verification."); return; } const ok = await submitEnquiry({ name: form.name, email: form.email, phone: form.phone, treatment: form.treatment, pagePath: window.location.pathname, pageLabel: "Treatment Page" }); if (ok) { setForm({ name: "", email: "", phone: "", treatment: "" }); setCaptchaToken(null); captchaRef.current?.reset(); } }}
                    className="w-full py-3 bg-[#003366] text-white rounded-full uppercase tracking-wide cursor-pointer hover:bg-[#004080] transition-colors"
                    style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}
                  >
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

        {/* Intro Section: Root Canal Treatment RCT */}
        <Box sx={{ mb: 5 }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Root Canal Treatment RCT
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Root Canal Treatment is done on a damaged or infected tooth. Infection could be due to a cracked or broken tooth, deep decay, gum diseases or maybe due to repeated dental treatment on a particular tooth. It becomes extremely important to get the Root Canal Treatment as:
          </Typography>
        </Box>

        {/* Section 1: What Is Root Canal Treatment? */}
        <Box id="what-is-rct" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is Root Canal Treatment?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The outer portion or Crown of a tooth is a three-layered structure namely – Enamel, Dentin & Pulp. If the tooth decay is limited to the first two layers, it can be corrected with Filling/ Restoration. In case the tooth decay reaches the third layer and causes inflammation or infection of pulp, an RCT or Endodontic Treatment is needed.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Root Canal Treatment (RCT) also is known as Endodontic Treatment is a procedure done when the tooth decay reaches the pulp (innermost layer of the tooth) causing inflammation. It is necessary to save the damaged tooth from extraction. This procedure is done by an Endodontist who is known as a Root Canal Specialist. The procedure involves:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc", marginTop: "12px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Removal of inflamed or infected tooth material
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Cleaning and disinfection
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Filling and sealing with an inert material
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Restoration and crown/cap
            </li>
          </ul>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            It is a multi-step procedure and may require multiple sittings.
          </Typography>
        </Box>

        {/* Section 2: Why Does One Need To Undergo Root Canal Treatment? */}
        <Box id="why-rct" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Why Does One Need To Undergo Root Canal Treatment?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Root Canal Treatment is done on a damaged or infected tooth. Infection could be due to a cracked or broken tooth, deep decay, gum diseases or maybe due to repeated dental treatment on a particular tooth. It becomes extremely important to get the Root Canal Treatment as:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc", marginTop: "12px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              It stops the infection from spreading and will then save the tooth from extraction
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              RCT relieves the pain caused due to inflammation
            </li>
          </ul>
        </Box>

        {/* Section 3: Symptoms */}
        <Box id="symptoms" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Symptoms
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The most common symptom that one might need Root Canal Treatment is a toothache. The pain can range from mild to severe. With time it may worsen, and you will feel the pain even when you bite your food.
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc", marginTop: "12px" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                The other reason is prolonged sensitivity. If you feel sensations in your tooth while consuming something hot or cold, then there is the slightest chance that one needs to undergo Root Canal Treatment.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Swelling in the gums can also be a sign that you need Root Canal Treatment.
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 4: Consequences of Not Getting RCT */}
        <Box id="consequences" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are The Consequences Of Not Getting A Root Canal Treatment?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If the pain you feel goes away, then it does not mean that your tooth had healed with time but this indicates that the nerves inside the tooth are all dead and the infection has grown manifolds.
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc", marginTop: "12px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              The bacteria from infection can enter into the tissues of gum and jaw which can cause a pus-filled abscess. This can even lead to a serious condition like heart disease and stroke.
            </li>
          </ul>
        </Box>

        {/* Section 5: Procedure */}
        <Box id="procedure" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                What Is The Procedure For Root Canal Treatment?
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Step 1:
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The very first step involves an X-ray which is taken to determine the extent and approach to infection. If required local anesthesia is administered before starting the treatment.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Step 2:
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The next step is Cavity Preparation. A cavity is prepared, making sure all the infected tooth material or previous filling material is removed and a proper approach to inner-part of the tooth (pulp) is established.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Step 3:
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                This is followed by disinfection and shaping of pulp canals. The infected pulp is cleared out completely, canals are shaped and cleaned. Thorough disinfection is achieved.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Step 4:
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Clean and disinfected canals are then sealed and filled with an inert rubber-like filling material known as Gutta-Percha.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Step 5:
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The very last step is restoration & crown. The crown portion of the tooth cavity is then restored with a filling, followed by a Cap/Crown cementation.
              </Typography>
            </div>
          </div>
        </Box>

        {/* Section 6: Post-Treatment Care */}
        <Box id="post-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Post-Treatment Care For Root Canal Treatment
              </Typography>
            </div>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not put pressure on the tooth. Since there is no crown, the tooth is unprotected as a result, putting pressure can cause damage to the tooth.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Avoid hard and crunchy food, instead chew soft food until final restoration
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Be careful while brushing. Do not be too harsh while brushing
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Get a dental crown as soon as possible as this will protect your tooth from further damage
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Visit your dentist if you face any complexities or severe pain
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 7: Price of RCT in India */}
        <Box id="price" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Price Of RCT In India
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The price of a root canal depends on the location and health of the afflicted tooth, as well as whether or not a crown is required. If the infection in your tooth is not treated, it might spread to adjacent teeth, gums, or even travel to other parts of your body, which will further become more expensive in the future.
          </Typography>
        </Box>

        {/* Section 8: Frequently Asked Questions */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Frequently Asked Questions
            </Typography>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
              Q.1. Can An Infected Tooth Heal Itself?
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              No, an infected tooth cannot heal itself. In fact, the infection can spread to other areas of your jaw causing serious pain. Treating an infected tooth requires medications or root canal treatment. For getting an RCT, book your appointment at the nearest 2HF Dental Clinic.
            </Typography>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
              Q.2. Do Root Canals Procedures Hurt A Lot?
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              No, a root canal treatment is pain-free. Before proceeding with the root canal treatment, a dentist will use local anaesthesia to numb the infected area ensuring a painless treatment.
            </Typography>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
              Q.3. How Long Does It Take To Heal?
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Once the root canal treatment is completed, the treated tooth will heal within a few days. Patients might experience some pain once they awaken from anaesthesia; this is likely to end within a few days due to medication.
            </Typography>
          </div>

          <div>
            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
              Q.4. Can One Get RCT Done In A Day?
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Most root canal treatment can be successfully completed by a dentist in a single day. In certain cases of serious infection, a dentist may give 2-3 days appointment for finishing the treatment.
            </Typography>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default RootCanalPage;
