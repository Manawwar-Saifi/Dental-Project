import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-dental-implants", label: "WHAT ARE DENTAL IMPLANTS?" },
  { id: "why-dental-implants", label: "WHY DENTAL IMPLANTS?" },
  { id: "difference-implants-bridges", label: "DIFFERENCE BETWEEN DENTAL IMPLANTS & BRIDGES" },
  { id: "advantages", label: "ADVANTAGES OF DENTAL IMPLANTS" },
  { id: "procedure", label: "DENTAL IMPLANT PROCEDURE" },
  { id: "post-operative", label: "POST-OPERATIVE INSTRUCTIONS FOR DENTAL IMPLANTS" },
  { id: "cost", label: "DENTAL IMPLANT COST" },
  { id: "post-care", label: "POST IMPLANTS CARE" },
];





const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const DentalImplantPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", treatment: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  return (
    <>
      <BreadcrumbBanner
        title="Dental Implants"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Treatments", path: "/treatments" },
          { label: "Dental Implants" },
        ]}
      />

      {/* Section Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ borderLeft: "4px solid #C8A951" }}>
          <span className="flex items-center gap-1 shrink-0" style={{ fontSize: "20px", fontWeight: 800, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
            Dental Implant <span style={{ fontSize: "14px" }}>&#8599;</span>
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
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#B8D4E3] p-4">
                <img
                  src="/images/dental-implant.png"
                  alt="Dental Implant Procedure"
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

            {/* Intro: Dental Implant */}
            <Box sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Dental Implant
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dental Implants help to overcome all the above-mentioned problems. They are no doubt the best, and most popular solution for the replacement of missing teeth. Dental implants are fit for every individual having missing teeth irrespective of their age and gender. With a 98% success rate, implants assure dental patients about their teeth and gum's wellbeing. Dental Implants are essentially a 'titanium screw' which is fused with the Jaw Bone
              </Typography>
            </Box>

            {/* Section 1: What Are Dental Implants? */}
            <Box id="what-are-dental-implants" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  What Are Dental Implants?
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dental implants are best the most popular and also the ideal solution, for replacing your missing tooth/teeth. They have definitely changed the course of dentistry in the last quarter of a century or so. A dental implant is basically a titanium implant which is surgically inserted into the jawbone beneath the gum line to work as a tooth root. Post insertion, an oral surgeon/implantologist will attach a crown on top of the implant to ensure the appearance of a natural tooth. Tooth Implants not only look and feel like your natural teeth but also function like.
              </Typography>
            </Box>

            {/* Section 2: Why Dental Implants? */}
            <Box id="why-dental-implants" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Why Dental Implants?
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                One can face the problem of missing teeth at any point in life. Tooth loss can be due to trauma, accident, severe gum disease, tooth decay or even due to poor oral hygiene. If left untreated missing teeth can lead to various consequences such as:
              </Typography>
              <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Speech problems resulting from the gap created by one or more missing teeth
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Difficulty in chewing
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Face may start look older and wrinkled with sunken cheeks as missing teeth can cause sagging of muscles which can't support lips & cheeks
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Pain in the facial muscles of the jaw resulting in an improper bite induced by the missing teeth
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Tooth decay and gum disease, over time, due to plaque accumulation & food entrapment in the gap caused by the missing teeth
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Improper bite resulting from a tilt of adjacent teeth into the empty spaces caused by a missing tooth
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Untreated missing teeth may dent the facial appearance causing low set-esteem or lack of confidence
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Hiding smile during conversations or at public gatherings to avoid the embarrassment caused by a bad smile from missing teeth
                </li>
              </ul>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dental Implants help to overcome all the above-mentioned problems. They are no doubt the best, and most popular solution for the replacement of missing teeth. Dental implants are fit for every individual having missing teeth irrespective of their age and gender. With a 98% success rate, implants assure dental patients about their teeth and gum's wellbeing. Dental Implants are essentially a 'titanium screw' which is fused with the Jaw Bone
              </Typography>
            </Box>

            {/* Section 3: Difference Between Dental Implants & Bridges */}
            <Box id="difference-implants-bridges" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div className="bg-gray-50 rounded-xl p-6">
                <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                  <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                    Difference Between Dental Implants & Bridges
                  </Typography>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: 700, color: "#1a1a1a", fontFamily: "'Poppins', sans-serif" }}>Bridges</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: 700, color: "#1a1a1a", fontFamily: "'Poppins', sans-serif" }}>Implants</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ backgroundColor: "white" }}>
                        <td style={{ padding: "10px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>May compromise the adjacent natural tooth</td>
                        <td style={{ padding: "10px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>Does not compromise with an adjacent tooth</td>
                      </tr>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <td style={{ padding: "10px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>A bridge may need replacement at times where bone loss continues at the site of the missing tooth</td>
                        <td style={{ padding: "10px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif", borderBottom: "1px solid #e5e7eb" }}>An implant causes no bone loss as it gets attached with the bone and promotes healthy bone</td>
                      </tr>
                      <tr style={{ backgroundColor: "white" }}>
                        <td style={{ padding: "10px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif" }}>With bridges, your teeth may be prone to plaque, decay or gum disease, with a risk of possible future root canal</td>
                        <td style={{ padding: "10px 16px", fontSize: "14px", color: "#555", fontFamily: "'Poppins', sans-serif" }}>With no free spaces in between, implants won't attract bacteria ever for plaque accumulation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Box>

            {/* Section 4: Advantages of Dental Implants */}
            <Box id="advantages" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Advantages of Dental Implants
                </Typography>
              </div>
              <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Dental Implants help restore the lost tooth and become the next best thing to your natural teeth
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Implants are a durable solution with the potential to even outlive the patient
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Dental Implants help maintain the shape and contour of face & smile which can go wrong due to missing teeth making the facial muscles sag
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Implants don't harm the adjacent tooth structure in any manner and protect healthy bone
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Implants ensure superior appearance and comfort with no speech issue to deal
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Implants boost your self-esteem for being a perfect solution to the missing tooth
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Implants give the freedom to enjoy your favourite foods without any worry
                </li>
              </ul>
            </Box>

            {/* Section 5: Dental Implant Procedure */}
            <Box id="procedure" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Dental Implant Procedure
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Placing a dental implant has various stages. They are listed as below:
              </Typography>

              <Typography variant="h6" sx={{ color: "#003366", mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Placing The Implant
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Thanks to the modern dentistry techniques, it's possible to make the implant placement procedure comfortable and pain-free. Concerned patients can also ask the dentist for sedation to feel relaxed while a dental implant is placed.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The procedure starts with the jawbone preparation, and the surgeon then makes a cut to expose the bone for drilling holes. The holes are kept deep enough for the implant to be placed properly and placed deep into the bone, like the root.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The doctor may require bone grafting in cases where the bone is weak or lacks the strength to support implant surgery. The surgeon then waits for the jawbone to heal and after that, places the metal post in it.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The entire process, from start to finish, may take many months where most of the time is spent on healing and waiting for the growth of new bone in the jaw.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                After this, a temporary crown is given to the patient which is placed to fill the gap, and also for achieving the aesthetic goal. This crown can be taken off for implant procedure, one has to wait until the bone is healed properly
              </Typography>

              <Typography variant="h6" sx={{ color: "#003366", mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Healing
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                During this process, the jawbone will grow and unite with the surface of the dental implant. This process is also referred to as osseointegration as it helps to offer a durable base for the new artificial tooth, much like roots do for the natural teeth.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                In general, this process takes between 3 to 6 months depending on the bone health & structure. However, the whole procedure can get completed in one day itself when patients have good bone structure.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                After that, you can schedule the second surgery but only once the implants are fused with the bone. Your dentists will take an x-ray to confirm whether the implant is fit for the second surgery.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The second surgery will be simpler than the first where a new incision is made to expose the heads of the implants.
              </Typography>

              <Typography variant="h6" sx={{ color: "#003366", mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Abutment Placement
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                You may need another surgery to place the abutment (the piece where the crown will attach) but only after healing is complete. This procedure is relatively simple typically done with anesthesia in an outpatient setting.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                During the procedure, the dentist will re-open the wound to attach the abutment to dental implant. A temporary crown will be given for 4 to 6 weeks to let the gums around the abutment heal. Such a crown is softer which can cushion the implant and may stress the soft tissues that can help in healing.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                For precaution purpose, you may need to eat only soft foods after each stage of surgery so to let the surgical site heal properly.
              </Typography>

              <Typography variant="h6" sx={{ color: "#003366", mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Placement Of Permanent Crown
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                In the next stage, the dentist will focus on making the permanent crown look exactly like your natural teeth. All the elements like the surface texture, color and anatomy will be tuned up to blend with the surrounding dentition.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                If you are not happy with the crown for any reason, consult your dentist so that it can be sent back to the dental technician for necessary changes.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Impressions of your mouth and remaining teeth are taken to make the crown so that a realistic-looking artificial tooth can be made. The crown, however, will not be placed until the jawbone is strong enough to support the new tooth.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                It takes less than 2 to 3 weeks to make a permanent crown which will then be cemented or screwed to the Implant.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                After permanent crown placement, your doctor will explain post-implant care instruction.
              </Typography>
            </Box>

            {/* Section 6: Post-Operative Instructions */}
            <Box id="post-operative" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div className="bg-gray-50 rounded-xl p-6">
                <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                  <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                    Post-Operative Instructions for Dental Implants
                  </Typography>
                </div>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                  Follow these post-operative instructions after Dental Implant procedure, and never hesitate in consulting the doctor for any question or problem:
                </Typography>
                <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Avoid touching, spitting or rinsing the wound on the day of surgery. Don't touch the metal healing abutment jutting through the gum tissue.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    After implant surgery, it's normal to have some bleeding or redness in the mouth for 24 hours. To control excessive bleeding, bite on a gauze pad (placed on the bleeding wound) for 30 minutes. If bleeding does not stop, seek further instructions from your dentist.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Swelling is natural after surgery. To minimize it, apply an ice pack on the cheek in the surgical area (you can also use a plastic bag or an ice-filled towel). Apply the ice as much as you could for the first 36 hours.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Drink lots of fluids but avoid consuming hot beverages. Stick to soft diet on the day of surgery. You can get back to the normal diet once the surgical area is healed. Don't drink anything using a straw.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Start taking pain medication as soon as you feel the effects of the local anesthetic are going down. However, take the medicines prescribed by the dentist.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Healing is not possible without good oral hygiene. Use the prescribed oral rinse while the day after surgery, use the prescribed oral rinse twice – after breakfast and before bed. Rinse for at least 30 seconds and then spit it out. Use warm salt rinses at least 4-5 times a day as well. Be gentle initially while brushing the surgical area to not affect the healing.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Do not use, or consume, tobacco products in any form or any type after implants. It not only hinders healing but may also increase the chances of implant failure.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Don't engage in exercise immediately after the surgery or keep it minimal at best. You should know that exercise may cause bleeding or throbbing, and it really happens, stop the activity right away. This may weaken you since you're not taking normal nourishment.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Healing abutments will be placed at the time of implant placement. So, do rinse them frequently and keep them clean. Wait for the stitches to dissolve and then clean the abutments through gentle massage.
                  </li>
                  <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                    Don't use partial or full dentures or flippers immediately after surgery or for 10 days afterward at least.
                  </li>
                </ul>
              </div>
            </Box>

            {/* Section 7: Dental Implant Cost */}
            <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Dental Implant Cost
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The cost of dental implants may worry some patients; however, implants are not too heavy on your pocket. There are multiple parts to each procedure which actually leads to a perception of implants being expensive. It is critical to understand that if a missing tooth is not replaced with an implant, sooner or later the adjacent teeth start shifting and jawbone loss also starts which ultimately would turn out to be much more expensive to manage than a single dental implant.
              </Typography>
            </Box>

            {/* Section 8: Post Implants Care */}
            <Box id="post-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Post Implants Care
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Good oral hygiene is important not just for your teeth and gums but also for overall wellbeing. Follow these tips to improve your oral health:
              </Typography>
              <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Brush twice a day to maintain good oral hygiene
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Choose your toothbrush carefully and go for one with a small head and soft bristles
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Change your toothbrush after every two to three months to not let frayed or worn-out bristles harm your teeth and gums
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Go gently & thoroughly and don't use too much force while brushing as it might cause abrasion
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Floss at least once a day to keep plaque, bacteria, and foods struck between the teeth out as it helps keep implants in good condition
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Take proper oral care at home to make your dental implants last a lifetime
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Use mouth rinses once a day after meals to stay on top of your oral health
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Don't eat sticky foods as implants can attract more bacteria that your natural teeth for being artificial in nature
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Eating and drinking right can help your implants stay out of the harm's way and such good oral care can make then last forever
                </li>
              </ul>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mt: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Visit the dental clinic regularly and try to achieve good oral hygiene to make your implants last for life.
              </Typography>
            </Box>

      </Container>
    </>
  );
};

export default DentalImplantPage;
