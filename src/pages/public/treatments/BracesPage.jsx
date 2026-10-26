import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-braces-used-for", label: "WHAT ARE BRACES USED FOR?" },
  { id: "what-are-braces", label: "WHAT ARE BRACES?" },
  { id: "adult-dentition", label: "WHAT IS ADULT DENTITION?" },
  { id: "mixed-dentition", label: "WHAT IS MIXED DENTITION?" },
  { id: "right-time", label: "WHAT IS THE RIGHT TIME TO GET BRACES?" },
  { id: "types", label: "WHAT TYPES OF BRACES ARE AVAILABLE?" },
  { id: "cost", label: "COST OF BRACES AND ALIGNERS" },
  { id: "post-care", label: "POST TREATMENT CARE FOR BRACES" },
  { id: "dos-and-donts", label: "DO'S AND DON'TS WITH BRACES ON" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const BracesPage = () => {
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
            Braces <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/braces.png"
                  alt="Braces"
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
                    <option value="dentures">Dentures</option>
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
              Braces
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental braces are appliances which are used to align or straighten the teeth and guide the teeth to the corrected position. They are made up of wires, brackets, and bands. Braces aid to correct irregular teeth positioning, jaw correction, improvement in chewing and smile aesthetics. Your dentist is the best person to guide on treatment options and modalities depending upon dentition.
          </Typography>
        </Box>

        {/* Section 1: What Are Braces Used For? */}
        <Box id="what-are-braces-used-for" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Braces Used For?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The major reason for getting Braces on is to improve the facial appearance, what people do not know is that there are any other implications which require orthodontic treatment like open bite, jaw structure, crossbite etc.
          </Typography>
        </Box>

        {/* Section 2: What Are Braces? */}
        <Box id="what-are-braces" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Braces?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental braces are appliances which are used to align or straighten the teeth and guide the teeth to the corrected position. They are made up of wires, brackets, and bands. Braces aid to correct irregular teeth positioning, jaw correction, improvement in chewing and smile aesthetics. Your dentist is the best person to guide on treatment options and modalities depending upon dentition.
          </Typography>
        </Box>

        {/* Section 3: What Is Adult Dentition? */}
        <Box id="adult-dentition" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                What Is Adult Dentition?
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              This is a stage where adult teeth or permanent teeth replace primary teeth which aid in appearance, speech, and digestion. During this phase, people can face many issues which can be corrected by Braces. These issues include:
            </Typography>
            <ul className="ml-5 list-disc">
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Crowding / Haphazardly placed teeth can lead to poor oral hygiene and can also be the reason for Dental Caries (Cavities)
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Improper Bite that affects chewing efficiency
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Crooked teeth which can be a major reason for Periodontal problems such as Bleeding gums, Halitosis (Bad Breath) and Tooth Mobility (Premature loss of teeth)
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                If the teeth are irregular, then it can cause calculus deposits leading to yellow teeth
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Forwardly placed / Proclined Teeth which leads to more convex profile and posteriorly displaced chin
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Open Bite
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                The spacing between teeth which can cause speech problems
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 4: What Is Mixed Dentition? */}
        <Box id="mixed-dentition" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is Mixed Dentition?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            This is a stage when one has a combination of both primary and permanent teeth in the mouth is called Mixed Dentition. Wearing Braces in this stage cure the following problems:
          </Typography>
          <ul className="ml-5 list-disc">
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Jaw Growth disorders at this stage can be corrected in a non-invasive manner which may later require surgical correction
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Treatment of crooked teeth. This needs to be treated during an early stage else it will affect Child's psychology
            </li>
          </ul>
        </Box>

        {/* Section 5: What Is The Right Time To Get Braces? */}
        <Box id="right-time" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is The Right Time To Get Braces?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Every individual is different. Orthodontic treatment can be started as young as 7 years old. There is no upper limit in terms of age for Braces. If you have good oral health and firm teeth, you can get braces at any age. There is various kind of orthodontic treatment available for all ages.
          </Typography>
        </Box>

        {/* Section 6: What Types Of Braces Are Available? */}
        <Box id="types" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Types Of Braces Are Available?
            </Typography>
          </div>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Metal Conventional Braces:
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            These are the traditional and most common type of braces. The metal braces used today are much more comfortable and smaller in size. These require elastics which come in a variety of colors to tie the wire to the braces. The wires use your body heat to move teeth more quickly and less painfully. There is no age limit attached to these, as patients of all ages can choose to straighten their teeth using metal braces.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Metal Self Ligating Braces
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            These are metal Brackets with a shutter or lock system and do not require the use of elastic to tie the wire. In comparison to traditional metal braces, metal self-ligating braces are more comfortable and smaller in size. These are helpful in achieving arch expansion and minimize the need for extraction.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Ceramic Conventional Braces
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Ceramic braces are the ones with clear brackets. They use tooth color and blends more naturally with your teeth. The shape and size are the same as metal braces. These are less visible on the teeth and as a result, are preferred by older teenagers and adults who might have aesthetic concerns. Sometimes, even the wires used are of tooth color which makes them less noticeable. Being less prominent, they require more care and protection compared to metal braces as they are larger and more brittle. They require extra protection, hence, are used more in upper teeth than lower.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Lingual Braces
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Lingual Braces are heavy metal braces which are placed behind the teeth. These metallic braces can be made even of silver or gold. The individual Bracket is customized using CAD-CAM / 3D Designing. The treatment is highly aesthetic and less visible. This, however, can cause mild speech difficulties during the course of the treatment.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Aligners
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Clear Aligners are medical grade plastic trays that do not require any braces or wire. They are totally invisible hence; the aesthetic concerns are duly met and make them very appealing with adults who need orthodontic treatment. Though placed inside they do not have any food restrictions associated. People believe that being placed on the inside; they might face speech difficulties; which is a myth. On the other hand, transparent braces are highly comfortable and hygienic. Clear Aligners also hide existing gaps.
          </Typography>
        </Box>

        {/* Section 7: Cost Of Braces And Aligners */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Cost Of Braces And Aligners
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The cost of braces and aligners completely depends from person to person depending on the teeth alignment & multiple other factors. There is no standardization of charges for braces and aligner treatment. At that first appointment, the dentist will examine you and take a digital scan of your cavity among other things. He or she will be able to offer you an exact estimate of the cost of the braces and aligners along with the duration of treatment based on this information.
            </Typography>
          </div>
        </Box>

        {/* Section 8: Post Treatment Care For Braces */}
        <Box id="post-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Post Treatment Care For Braces
            </Typography>
          </div>
          <ul className="ml-5 list-disc">
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Brush and floss twice a day to keep your teeth healthy. Healthy teeth respond better to the treatment.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Visit your dentist on time for follow-up checks. Make a note of your appointments and follow suggestions, if any.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Be patient. The treatment duration may vary depending on the case. The teeth will take the time to adjust accordingly.
            </li>
          </ul>
        </Box>

        {/* Section 9: Do's And Don'ts With Braces On */}
        <Box id="dos-and-donts" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Do's And Don'ts With Braces On
            </Typography>
          </div>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            DO'S
          </Typography>
          <ul className="ml-5 list-disc" style={{ marginBottom: "20px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Try and avoid sticky food like gum or caramel.
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Ask for a mouth guard, if you play a sport
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Consume drinks which are low on sugar content and not carbonated
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Brush after every meal and never let food stuck on your braces
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Visit your dentist on every follow-up
            </li>
          </ul>

          <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            DON'TS
          </Typography>
          <ul className="ml-5 list-disc" style={{ marginBottom: "16px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Don't chew hard food and ice
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Do not bite your fingernails
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Do not consume more than one soda a week
            </li>
          </ul>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Do not forget to floss like a boss
          </Typography>
        </Box>

        {/* Section 10: FAQs */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. How Long Does It Take to Put Braces On?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                After bonding the dental braces, it takes about 1-2 hours for the process to finish.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. Are Teeth Extracted for Orthodontic Treatment?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Usually, orthodontists do not recommend tooth extraction for fixing teeth braces. But if there is a serious crowding issue, one or two teeth need to be removed.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. What Color Braces Should One Get?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                There is a variety of braces available and it depends on the patient getting them. If the patient wishes so, they can even get transparent/ceramic braces as well. For more information on what kind of braces will be more suitable for your needs, visit a Dental specialist at Clove Dental
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Are Braces Painful?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Getting or having braces is not painful. However, slight discomfort and soreness are usual after getting them. Apart from this, metal braces may feel to be a little tight after getting them readjusted on a follow-up visit to the orthodontist.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.5. How Long Do One Need to Wear Braces?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The total duration of wearing dental braces depends on multiple factors that include the condition of teeth and compliance to oral care practices. Usually, the duration may vary from 18-36 months.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Q.6. What Can You Not Eat with Braces On?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                While wearing dental braces, one must definitely avoid any carbonated drinks, sticky food, and crunchy food including ice and popcorn.
              </Typography>
            </Box>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default BracesPage;
