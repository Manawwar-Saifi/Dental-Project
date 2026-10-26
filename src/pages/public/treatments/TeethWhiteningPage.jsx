import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-is-teeth-whitening", label: "WHAT IS TEETH WHITENING?" },
  { id: "need-for-teeth-whitening", label: "WHAT IS THE NEED FOR TEETH WHITENING?" },
  { id: "how-it-works", label: "HOW DOES TEETH WHITENING WORKS?" },
  { id: "risk", label: "IS THERE A RISK ASSOCIATED WITH TEETH WHITENING?" },
  { id: "cost", label: "COST FOR TEETH WHITENING" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const TeethWhiteningPage = () => {
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
            Teeth Whitening <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/teeth-whitening.png"
                  alt="Teeth Whitening"
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

        {/* Section 1: What Is Teeth Whitening? */}
        <Box id="what-is-teeth-whitening" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is Teeth Whitening?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Teeth whitening is a process of removing stains from the tooth surface and restoring the natural color of the teeth. Whitening is a one-time procedure performed by a dentist. It is amongst the most common and widely adopted procedure. With the advent of the latest Dental technology, we have advanced whitening treatment procedures which give reliable and long-lasting results.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            For better results do get it done from a trained dental professional.
          </Typography>
        </Box>

        {/* Section 2: What Is The Need For Teeth Whitening? */}
        <Box id="need-for-teeth-whitening" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Is The Need For Teeth Whitening?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The enamel which reflects the natural color of your tooth can stain or dentin which is the inner surface of teeth stains and yellows the teeth. The causes of tooth discoloration are varied. Though many causes can be prevented yet there are some which are not in control. The causes of discoloration are:
          </Typography>
          <ul className="ml-5 list-disc" style={{ marginBottom: "16px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Consuming tea, coffee, wine, cola frequently
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Smoking cigarettes and chewing tobacco
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              High intake of fluoride during childhood
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Damage of developing permanent teeth due to accident or trauma
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Aging can also contribute to staining of teeth as with age the enamel gets thinner exposing the dentin below. With age, the dentin come in contact with certain food and beverage and can stain your teeth
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Certain medical treatments can also contribute to staining of teeth
            </li>
          </ul>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The process of Teeth Whitening clears the stain and make your teeth look whiter. However, one should keep in mind that the results may vary from person to person.
          </Typography>
        </Box>

        {/* Section 3: How Does Teeth Whitening Works? */}
        <Box id="how-it-works" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                How Does Teeth Whitening Works?
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Your dentist will first photograph your teeth which will help to know the progress of the treatment. This is also used to examine your tooth and figure out the stains. After examining the tooth dentist will start by cleaning the tooth. He will remove the film on your enamel coated due to the food you eat or due to other substances. The whitening process begins after this. The entire process takes around 30-90 mins depending upon the severity of the stains on teeth. Your dentist will cover the gums and will then apply the whitening agent on teeth. Some whitening agents require laser lights on them and if your teeth are badly stained then your dentist will suggest you continue the process at home for a few days.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              You can also opt for home whitening treatment, in this, your dentist will take an impression of your teeth and will make a custom fit mouthpiece. This helps the whitening agent to stay intact on your teeth.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              One can also buy over the counter whitening products which is suitable only for the teeth which are not heavily stained.
            </Typography>
          </div>
        </Box>

        {/* Section 4: Is There A Risk Associated With Teeth Whitening? */}
        <Box id="risk" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Is There A Risk Associated With Teeth Whitening?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Teeth whitening do not have any risks associated however, some people may feel sensitivity for a few days or can experience mild gum irritation for some days. Because Teeth Whitening is a cosmetic procedure it is not advised to pregnant ladies. They can get it done only after delivery.
          </Typography>
        </Box>

        {/* Section 5: Cost For Teeth Whitening */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Cost For Teeth Whitening
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The cost of teeth whitening might vary greatly depending on the product and technique used. In addition, it also depends on the condition of your teeth. The dentists at 2HF Dental would be able to give you an estimate after a complete evaluation of your teeth and smile.
          </Typography>
        </Box>

        {/* Section 6: FAQs */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <ul className="ml-5 list-disc">
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "18px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <strong style={{ color: "#003366" }}>Q.1. How Often Should You Get Your Teeth Whitened?</strong><br />
                A tooth whitening treatment by professional lasts for about a year. Thus, undergoing a teeth whitening process after one year is considered healthy for overall oral health and a lasting smile. If you want to get expert teeth whitening treatment, get an appointment today.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "18px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <strong style={{ color: "#003366" }}>Q.2. Can One Brush Their Teeth After the Whitening Process?</strong><br />
                Brushing teeth right after a tooth whitening treatment is not advised by dentists. Individuals must allow few hours to pass before brushing the teeth for the first time after treatment.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "18px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <strong style={{ color: "#003366" }}>Q.3. Is Teeth Whitening Permanent?</strong><br />
                There are many types of teeth whitening treatment. The effect of each treatment differs from few months to up to three years. However, individuals who consume a lot of tea, coffee, and tobacco, or smoke will not be able to see the results for a longer time.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "18px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <strong style={{ color: "#003366" }}>Q.4. Does Coconut Oil Whiten Teeth?</strong><br />
                There is no proven research that shows the usage of coconut oil for teeth whitening. Dentists suggest that individuals must refrain from experimenting with their teeth as it can lead to side effects too.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                <strong style={{ color: "#003366" }}>Q.5. What Is the Cost of Teeth Whitening Treatment?</strong><br />
                The teeth whitening cost differs on aspects like oral health situation of an individual and type of treatment selected. Patients must discuss with a dentist to get complete details of price for the teeth whitening treatment.
              </li>
            </ul>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default TeethWhiteningPage;
