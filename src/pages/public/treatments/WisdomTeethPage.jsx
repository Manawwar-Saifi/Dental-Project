import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-wisdom-teeth", label: "WHAT ARE WISDOM TEETH?" },
  { id: "problems", label: "WHAT PROBLEMS CAN A WISDOM TOOTH CAUSE?" },
  { id: "need-to-remove", label: "IS THERE A NEED TO REMOVE WISDOM TEETH?" },
  { id: "symptoms", label: "SYMPTOMS TO GET WISDOM TEETH REMOVED" },
  { id: "should-be-removed", label: "SHOULD WISDOM TEETH BE REMOVED?" },
  { id: "procedure", label: "PROCEDURE FOR WISDOM TOOTH EXTRACTION" },
  { id: "price", label: "PRICE OF TOOTH EXTRACTION" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const WisdomTeethPage = () => {
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
            Wisdom Teeth <span style={{ fontSize: "14px" }}>&#8599;</span>
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
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#f5e0d8] p-4">
                <img
                  src="/images/wisdom-teeth.png"
                  alt="Wisdom Teeth"
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

        {/* Intro: Wisdom Teeth */}
        <Box sx={{ mb: 5 }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Wisdom Teeth
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Wisdom teeth known as third molars are the last teeth to erupt. One usually gets them in late teens or early twenties. However, even instances of eruption in late adulthood are common. If they erupt smoothly and without any interruption, then they can be proved as an asset.
          </Typography>
        </Box>

        {/* Section 1: What Are Wisdom Teeth? */}
        <Box id="what-are-wisdom-teeth" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Wisdom Teeth?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Wisdom teeth known as third molars are the last teeth to erupt. One usually gets them in late teens or early twenties. However, even instances of eruption in late adulthood are common. If they erupt smoothly and without any interruption, then they can be proved as an asset. But the problem with third molars is that in case they do not erupt properly or are misaligned, they would need to be extracted. If they are poorly aligned, then they can damage the adjacent teeth.
          </Typography>
        </Box>

        {/* Section 2: What Problems Can A Wisdom Tooth Cause? */}
        <Box id="problems" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                What Problems Can A Wisdom Tooth Cause?
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              It is also possible that wisdom tooth is impacted. This means that the wisdom teeth remain intact in the soft tissue and partially break or erupt through gums. If they remain partially open, then the chances of bacteria entering the tooth are high which may cause infection & lead to the swelling in the jaw, pain and general illness. Because of the misaligned positioning of the jaw, it will become difficult to brush or floss making the tooth prone to decay and gum disease. There is 4 set of wisdom teeth two on each upper and lower jaw. Nowadays majorly due to lifestyle changes people do not get wisdom teeth. This is because the jaws do not develop completely & properly which restrain the wisdom teeth to erupt.
            </Typography>
          </div>
        </Box>

        {/* Section 3: Is There A Need To Remove Wisdom Teeth? */}
        <Box id="need-to-remove" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Is There A Need To Remove Wisdom Teeth?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            It is not necessary to remove wisdom teeth as long as they are not causing any problem. They would have to be extracted if they are impacted or causing crowding. If you do not remove the wisdom tooth, it will be impacted. Your mouth might not provide space for it to erupt as a result it will erupt at the wrong angle which can damage the adjacent tooth. Your dentist may advise you to remove your third molar at an early stage, this is because as you age the bones in your mouth becomes harder which will then make it difficult to remove. Delaying can also lead to severe surgeries and heavy bleeding or can even cause a minor loss of movement in your jaw.
          </Typography>
        </Box>

        {/* Section 4: Symptoms To Get Wisdom Teeth Removed */}
        <Box id="symptoms" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Symptoms To Get Wisdom Teeth Removed
            </Typography>
          </div>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Pain behind molars which can increase with time.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Redness, swelling, tenderness which can lead to infection
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Foul breath, bad taste can also be detected due to wisdom teeth
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Jaw pain and stiffness
            </li>
          </ul>
        </Box>

        {/* Section 5: Should Wisdom Teeth Be Removed? */}
        <Box id="should-be-removed" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Should Wisdom Teeth Be Removed?
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Wisdom teeth may/should be removed in case of any understated problems. Your dentist will be able to help and guide you with diagnosis:
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Crowding: The adjacent teeth are getting harmed. Because of the misalignment wisdom teeth if erupts in the wrong angle then it can harm other teeth.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Jaw Damage: Wisdom teeth can damage your nerves making the jaw hollow.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Sinus Issue: Wisdom teeth can be a reason for sinus pain and congestion.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Gum Problem: It will be difficult to clean the area which results in swelling of the tissue.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Gaps in Gums: The pocket is created due to swollen gums thus helping in the process of decay
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 6: Procedure For Wisdom Tooth Extraction */}
        <Box id="procedure" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Procedure For Wisdom Tooth Extraction
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The tooth removal process depends upon the stage in which the wisdom teeth is. It is easy to extract wisdom tooth if it has fully erupted. But if the tooth is impacted then it will require an incision in the gums. Usually, the tooth is extracted in parts to minimize the amount of bone required to be extracted for tooth removal.
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 2 }} style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
            Post Wisdom Tooth Removal
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc", marginTop: "8px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Avoid vigorous rinsing and touching the area
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              If you start feeling discomfort take the prescribed medicines
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              A certain amount of bleeding is expected, however, if the bleeding exceeds then visit your dentist immediately
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Swelling around mouth and cheeks is common for a couple of days
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Be on a liquid diet for the first few days. Avoid the use of straw
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Do brush twice a day but make sure you are gentle on rinsing
            </li>
          </ul>
        </Box>

        {/* Section 7: Price Of Tooth Extraction */}
        <Box id="price" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Price Of Tooth Extraction
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The cost of a tooth extraction depends on the position of the tooth, the degree of its impaction, the requirement of anaesthesia, the requirement of sutures etc. Always talk to your dentist about these factors that may influence the cost of the procedure.
          </Typography>
        </Box>

        {/* Section 8: Frequently Asked Questions */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. Do Wisdom Teeth Need To Be Removed?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                It depends on how they have erupted and grown. In many instances, it is seen that the mouth does not have enough space, thus causing crowding <strong>impacted wisdom tooth.</strong> In such cases, the wisdom teeth need to be removed. If they have grown without any hassle, then there is no need.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. Do They Put You On Anaesthesia For The Procedure?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dentists usually prefer to numb the area before <strong>wisdom tooth extraction,</strong> and thus recommend a local anaesthesia. If you need to get them removed, consult an expert dentist at your nearest 2HF Dental clinic.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. How Long Does The Pain Last After The Removal Of Wisdom Teeth?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The <strong>wisdom tooth pain</strong> may be there for at most a couple of days. In these days, you will need to take all the necessary precautions as directed by your dentist.
              </Typography>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default WisdomTeethPage;
