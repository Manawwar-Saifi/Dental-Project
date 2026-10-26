import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-is-dental-filling", label: "WHAT IS DENTAL FILLING?" },
  { id: "when-need-filling", label: "WHEN DOES ONE NEED DENTAL FILLING?" },
  { id: "procedure", label: "WHAT IS THE PROCEDURE OF DENTAL FILLING?" },
  { id: "consequences", label: "CONSEQUENCES OF NOT GETTING A DENTAL FILLING DONE" },
  { id: "price", label: "PRICE OF DENTAL FILLING IN INDIA" },
  { id: "types", label: "TYPES OF DENTAL FILLINGS" },
  { id: "post-care", label: "POST TREATMENT CARE FOR DENTAL FILLING" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const DentalFillingPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", treatment: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  return (
    <>
      <BreadcrumbBanner
        title="Dental Filling"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Treatments", path: "/treatments" },
          { label: "Dental Filling" },
        ]}
      />

      {/* Section Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ borderLeft: "4px solid #C8A951" }}>
          <span className="flex items-center gap-1 shrink-0" style={{ fontSize: "20px", fontWeight: 800, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Dental Filling <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/dental-filling.png"
                  alt="Dental Filling"
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
                    <option value="dental-filling">Dental Filling</option>
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

        {/* Section 1: What Is Dental Filling? */}
        <Box id="what-is-dental-filling" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is Dental Filling?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental Filling is a treatment modality to restore missing tooth structure which could have been a result of decay or trauma. Decay makes tooth hollow. Dental Filling helps to fill this gap and protect it from further decay. A filling is also used to repair broken or cracked tooth and the teeth which wear off due to dental habits like teeth grinding, nail biting etc.
          </Typography>
        </Box>

        {/* Section 2: When Does One Need Dental Filling? */}
        <Box id="when-need-filling" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              When Does One Need Dental Filling?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            There are various signs and symptoms where fillings can be required. The symptoms could be as below:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>A hole in your tooth</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Dark spots on the tooth</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Food stuck between certain areas of the teeth</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Chipped or broken tooth</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Sensitivity to hot and cold food and beverage</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Single or multiple cavities</li>
          </ul>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If you come across any of the symptoms as mentioned above, then there is a chance that you need a filling. The final decision will be of your dentist after a thorough oral examination.
          </Typography>
        </Box>

        {/* Section 3: Procedure (gray bg) */}
        <Box id="procedure" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                What Is The Procedure Of Dental Filling?
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
              Dental Filling is normally required if your tooth is decayed. It can prevent further damage and can protect your tooth.
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>The very first step in this process is to see how severe the infected tooth is. This is because Dental Filling is only suitable for minor fractures and decay</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>The dentist then examines the tooth and if required an X-ray would be done for precise information</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Depending upon the extent of decay, local anaesthesia is administered to make the area around the infected tooth numb</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Then the decayed or damaged tooth or the areas around it is prepared for restoration</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>If the tooth is damaged, then a dental handpiece or a laser can be used to remove the damaged part</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>A filling is then applied to the area to fill the cavity. The type of filling will depend upon case to case and person to person</li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Finally, the finished tooth can be polished to conclude the dental filling procedure</li>
            </ul>
          </div>
        </Box>

        {/* Section 4: Consequences */}
        <Box id="consequences" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Consequences Of Not Getting A Dental Filling Done
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If you have decay, then it is extremely important to get Fillings done because if the treatment is not done on time, then slowly the enamel (outer part of teeth) start decaying exposing the dentin (the hard part below the enamel). The bacteria in your mouth will come in contact with dentin, causing infection. Once the infection starts, you will feel sensitivity and will then want to get Fillings done. But if you skip this part and do not get the treatment done on time, then the infection will reach to the nerve which will eventually damage the tooth and then one needs to undergo root canal treatment. You are also at risk of the infection traveling to the adjacent tooth making it prone to decay.
          </Typography>
        </Box>

        {/* Section 5: Price */}
        <Box id="price" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Price Of Dental Filling In India
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Fillings are a very affordable and efficient restoration method, but the cost varies greatly in different situations and for different patients. The cost of treatment is determined by the size of the filling, the number of fillings necessary, and the material you choose. Investing in a filling to restore your teeth today might reduce your chances of needing more expensive procedures later. For example, if a cavity is left untreated, it can lead to loss of tooth and replacing a missing tooth is significantly costlier than a dental filling.
          </Typography>
        </Box>

        {/* Section 6: Types of Dental Fillings */}
        <Box id="types" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Types Of Dental Fillings
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental Fillings are of various types. The type of filling to be used will depend upon the condition of decay and other factors such as a person being allergic to a material. The different type of fillings available are:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Metal Filling</strong><br />
              This old age filling is long lasting. In this type, Silver Filling is comparatively inexpensive. But gold though expensive is a preferred choice. Because they can withstand chewing forces and last usually from 10-15 years.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Amalgam Filling</strong><br />
              These are the most researched and widely used by dental professionals since quite long now. They are made of several metals combined and therefore, they have high strength.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Composite Filling</strong><br />
              These are of the same color as your teeth. These are preferred if a person does not want their filing to be seen. It is recommended & suitable for front teeth. It bonds well with the tooth structure. It is also used for a chipped tooth, however, does not last long as compared to metal and amalgam filling and can also wear off with time.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              <strong style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>Porcelain / Ceramic Filling</strong><br />
              The porcelain filling is best suited if you have serious aesthetic concerns. These cover most part of the tooth, as a result, can be used if the decay is large enough. This long-lasting filling does not stain or wear off easily.
            </li>
          </ul>
        </Box>

        {/* Section 7: Post Treatment Care */}
        <Box id="post-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Post Treatment Care For Dental Filling
            </Typography>
          </div>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Before you start chewing, make sure that the anaesthesia is worn off</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Do not consume anything too hot or too cold if the effect of anaesthesia is still on</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>You might feel soreness around your gum area, this will last only for a few days`</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Avoid hard or sticky food for a few days</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>If you have a habit of grinding your teeth, then make sure you use a mouthguard to protect your filling</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>If you feel sensitivity for too long or if your dental fillings, come out, visit your dentist immediately</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>Maintain a good Oral Hygiene routine like cleaning, brushing, mouthwash & flossing</li>
          </ul>
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
                Q.1. How Long Does A Dental Filling Last?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The longevity of Dental Filling depends upon the material of the filling. It also depends on how well you take care of your filling. The life of Dental Filling varies from 10 years to 20 years.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. Can Dental Filling Fall Off?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Yes, but the chances are rare.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. What To Do If Your Fillings Come Out?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Visit your dentist as soon as your Dental Filling comes out.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. How To Know That Dental Filling Is Loose?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                If you have sensitivity even after getting the filling done, then it is likely that your filling is about to come off. Or if you feel pressure while eating or have a constant toothache then the chances of it coming off is high.
              </Typography>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default DentalFillingPage;
