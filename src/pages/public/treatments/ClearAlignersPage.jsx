import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-clear-aligners", label: "WHAT ARE CLEAR ALIGNERS?" },
  { id: "how-do-they-work", label: "HOW DO THEY WORK?" },
  { id: "difference", label: "DIFFERENCE BETWEEN TRADITIONAL BRACES & CLEAR ALIGNERS" },
  { id: "care-with-aligners", label: "CARE WITH ALIGNERS ON" },
  { id: "post-treatment-care", label: "POST-TREATMENT CARE" },
  { id: "cost", label: "COST OF CLEAR ALIGNERS IN INDIA" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const ClearAlignersPage = () => {
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
            Clear Aligners <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/clear-aligner.png"
                  alt="Clear Aligners"
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
              Clear Aligners
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Clear Aligners are transparent trays made of special material which are used to straighten teeth just like braces. They use gentle and constant force to move the teeth in the required position without going through the hassles of metal wires and brackets. They are custom made for each patient through a digital scan.
          </Typography>
        </Box>

        {/* Section 1: What Are Clear Aligners? */}
        <Box id="what-are-clear-aligners" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Clear Aligners?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Clear Aligners are transparent trays made of special material which are used to straighten teeth just like braces. They use gentle and constant force to move the teeth in the required position without going through the hassles of metal wires and brackets. They are custom made for each patient through a digital scan.
          </Typography>
        </Box>

        {/* Section 2: How Do They Work? */}
        <Box id="how-do-they-work" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                How Do They Work?
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              They are custom made for every person and designed to move teeth in the desired direction very very slowly. This is achieved by digitally capturing impression and processing the information using specialized software, where the future projections for better results and straighter teeth are computed and then the milling machine automatically custom fabricates the set of trays for you. On average, a person needs approximately 25-40 sets for complete alignment.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The aligners come with an advantage i.e. they are very snugly fitting which over a period becomes virtually a part of the body and hence causes no speech problems. There are no restrictions on eating and drinking any foods as you will be removing them before every meal.
            </Typography>
          </div>
        </Box>

        {/* Section 3: Difference Between Traditional Braces & Clear Aligners */}
        <Box id="difference" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Difference Between Traditional Braces & Clear Aligners
            </Typography>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "14px", fontWeight: 600, fontFamily: "'Poppins', sans-serif", backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}></th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "14px", fontWeight: 600, fontFamily: "'Poppins', sans-serif", backgroundColor: "#e5e7eb", color: "#333" }}>Traditional Braces</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "14px", fontWeight: 600, fontFamily: "'Poppins', sans-serif", backgroundColor: "#003366", color: "white" }}>Clear Aligners</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500, color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>Visibility</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>Highly Noticeable</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "white", fontFamily: "'Poppins', sans-serif", backgroundColor: "#1a5fa0", borderBottom: "1px solid #1a5fa0" }}>Invisible – One cannot spot them easily</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500, color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>Removability</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>Non – Removable</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "white", fontFamily: "'Poppins', sans-serif", backgroundColor: "#1a5fa0", borderBottom: "1px solid #1a5fa0" }}>Removable – People have freedom to remove aligners while eating, brushing & flossing</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500, color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>Oral Hygiene</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>Difficult to maintain routine healthy Oral Care</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "white", fontFamily: "'Poppins', sans-serif", backgroundColor: "#1a5fa0", borderBottom: "1px solid #1a5fa0" }}>Since removable, it is easy to maintain routine healthy Oral Care</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500, color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>Comfort</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>Can cause abrasion in mouth</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "white", fontFamily: "'Poppins', sans-serif", backgroundColor: "#1a5fa0", borderBottom: "1px solid #1a5fa0" }}>Fits smoothly on the teeth</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500, color: "#555", fontFamily: "'Poppins', sans-serif" }}>Duration</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", backgroundColor: "#f9fafb" }}>Takes longer than aligners(varies from case to case)</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "white", fontFamily: "'Poppins', sans-serif", backgroundColor: "#1a5fa0" }}>Takes relatively less time than traditional braces(varies from case to case)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Box>

        {/* Section 4: Care With Aligners On */}
        <Box id="care-with-aligners" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Care With Aligners On
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Though aligners are the most comfortable option, yet there are certain things that need to be kept in mind while you have it on. Your Orthodontist will give you a set of guidelines that should be followed diligently such as below:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              You should wear the aligners for at least 20 hours a day for the effective results
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Remove your aligners while brushing, flossing & eating. Never have it on especially while consuming anything hot
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Keep your aligners clean. While you brush make sure that you brush your aligners in the same way
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Keep them safe in the box as given by your Orthodontist to prevent it from getting dirty
            </li>
          </ul>
        </Box>

        {/* Section 5: Post-Treatment Care */}
        <Box id="post-treatment-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Post-Treatment Care
              </Typography>
            </div>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Retain your smile with Retainer – Just because you've got your teeth straightened does not necessarily mean that it will stay straight throughout. Your Orthodontist might advise retainers which will prevent your teeth to shift back to their previous location
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Take care of your food habits – It may so happen that your teeth are sensitive after the treatment, therefore, it is advised to not consume, too crunchy food for a few days. Let your smile rest before going back to the crunchy munchy snacks
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not forget to brush – Keep up your habit of brushing twice a day and flossing in order to keep your teeth clean and healthy. Not taking good care of your oral hygiene will let the treatment go in vain.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Visit your dentist – Because you are done with your treatment and have got that perfect smile you always desired for does not mean that you need not visit the dentist ever. Always visit a dentist after every 6 months to ensure that this smile remains intact.
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 6: Cost of Clear Aligners in India */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Cost Of Clear Aligners In India
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The cost of Invisible Braces Treatment or Clear Aligner Treatment varies depending on the alignment of teeth and other factors that can be assessed by a dentist with a full mouth scan. The cost of treatment is determined by a variety of criteria, including the intricacy of the case, the number of improvements required, and the number of aligners used. While all of these factors are interconnected, the number of aligners required for treatment is one of the most important
          </Typography>
        </Box>

        {/* Section 7: Frequently Asked Questions */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. Are Invisible Aligners As Good As Braces?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Aligners offer multiple advantages over traditional braces. They are discreet and offer better results in a hassle-free and fast manner. Teeth Aligners are also way more comfortable than traditional braces. However, patients still need to be very disciplined about wearing aligners for ensuring treatment success.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. Can Anyone Get Teeth Aligners?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Clear Aligners/ Invisible braces are an ideal orthodontic treatment for people of all ages. They are discreet, hassle-free and very effective. However, compliance is more demanding in the case of children. Parents considering aligners for their children must consult an orthodontist at 2HF Dental and ensure that the child is a perfect candidate for aligners.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. How Long Does It Take To Recover?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Aligners are hassle-free and promise much faster results than traditional braces. Getting accustomed to aligners is easy and the recovery time is also shorter. But in some cases, it can vary depending on the teeth straightening needs and overall patient compliance. Ideally, recovery time for aligners is between 13-15 months.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Are The Results Permanent?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The results are permanent only if patients practice proper aftercare. There is a natural tendency for teeth to relapse after teeth aligners are removed. Ideally, retainers are used to avoid any chances of relapse. Patients can either opt for either fixed or removable retainers to ensure the results are permanent.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.5. Are There Any Side-Effects Of The Treatment?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                No, there are no side effects. Aligners are one of the safest orthodontics treatment. Further, a dentist will suggest aligners only after proper assessment of the current state of your smile. Chances of irritation and discomfort are extremely negligible and most patients get accustomed to aligners within 2-3 weeks.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.6. What Is The Price Of Treatment?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Aligners are costlier than traditional braces. Further, aligners cost vary depending upon a patient's smile restoration needs. However, considering its effectiveness in getting a perfect smile, the treatment is worth all its costs.
              </Typography>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default ClearAlignersPage;
