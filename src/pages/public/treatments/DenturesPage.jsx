import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "what-are-dentures", label: "WHAT ARE DENTURES?" },
  { id: "types-of-dentures", label: "TYPES OF DENTURES" },
  { id: "procedure", label: "PROCEDURE" },
  { id: "how-to-take-care", label: "HOW TO TAKE CARE" },
  { id: "dos-and-donts", label: "DO'S AND DON'TS" },
  { id: "myths", label: "MYTHS" },
  { id: "cost", label: "COST" },
  { id: "faqs", label: "FAQS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const DenturesPage = () => {
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
            Dentures <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/dentures.png"
                  alt="Dentures"
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
        <div className="dentures-page">

          {/* Section 1: What Are Dentures? */}
          <Box id="what-are-dentures" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  What Are Dentures?
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dentures are removable appliances that are used as a replacement of missing teeth and tissues. They are the artificial teeth which enable normal functioning of human mouth. Dentures are of two types – Complete & Partial.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Complete dentures are advised when all the teeth are missing, and partial dentures are applied when some natural teeth are missing. They are custom made especially for a set of teeth and gum line.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Complete Dentures fit over the upper teeth and roof and on the lower teeth placed like a horseshoe. They are conventional dentures and are removed during the night for cleaning. Partial Dentures consists of replaced missing teeth attached to artificial gum connected by a metal framework which helps to hold the denture in place. Missing teeth can change the position of other teeth hence partial denture help to overcome this problem and keep the teeth intact.
              </Typography>
            </div>
          </Box>

          {/* Section 2: Types of Dentures */}
          <Box id="types-of-dentures" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div bg-gray-50 rounded-xl p-6">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Types Of Dentures
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dentures are made of porcelain and acrylic resin.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Porcelain dentures look more natural and match easily with the remaining teeth. But porcelain, if dropped, will break easily and can wear down the remaining teeth hence, are better used as complete dentures rather than partial.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Acrylic resin dentures, on the other hand, are light in weight and easy to adjust. They fit properly and make the jaw movement smoother.
              </Typography>
            </div>
          </Box>

          {/* Section 3: Procedure */}
          <Box id="procedure" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  What Is The Procedure Involved In Placing Dentures?
                </Typography>
              </div>
              <ul className="ml-5 list-disc" style={{ marginTop: "8px" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#003366" }}>Step 1</strong><br />
                  The doctor will first take the impressions of your jaw to analyse how well they relate to one another and whether they have spaces in between them.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#003366" }}>Step 2</strong><br />
                  A wax model is then prepared to check the fitting.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#003366" }}>Step 3</strong><br />
                  Final Denture is made with the wax model.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#003366" }}>Step 4</strong><br />
                  The patient is made to try the final set of dentures and if necessary, adjustments will be made.
                </li>
              </ul>
            </div>
          </Box>

          {/* Section 4: How To Take Care */}
          <Box id="how-to-take-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div bg-gray-50 rounded-xl p-6">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  How To Take Care Of The Dentures?
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Since these are artificial and removable, therefore, it becomes extremely important to handle them with care. If you want your dentures to have a longer life, the following tips should be taken into consideration:
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Keep Your Dentures Clean
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Always ensure that your dentures are clean for this you need to brush your dentures with a non-abrasive brush at least once a day. Though they are artificial, yet plaque and bacteria can build up on the teeth causing damage to other teeth and gums. If possible, remove your dentures after every meal and wash it with warm water but if you have complete dentures, then mere brushing would do.
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Overnight Protection
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Soak your dentures at night in water or in the denture solution as prescribed by your dentist. So that your dentures do not weaken avoid chlorine with it. While putting dentures on in the morning make sure you rinse them with clean water as this will help to remove the chemicals if any during the soaking process.
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                Keep A Look at Your Dentures
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Monitor your dentures time to time and visit your dentist if your dentures loosen, slip or you come across a change in the bite. Having ill-fitting dentures can cause infections and irritations.
              </Typography>
            </div>
          </Box>

          {/* Section 5: Do's And Don'ts */}
          <Box id="dos-and-donts" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Do's And Don'ts While Dentures On
                </Typography>
              </div>

              <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                DO'S
              </Typography>
              <ul className="ml-5 list-disc" style={{ marginBottom: "20px" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Soak your dentures overnight in water or solution given by your dentist
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Rinse your dentures before putting them on in the morning
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Brush daily with soft bristles with tooth paste as prescribed by your dentist
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Do take care of your mouth, gums, and tongue
                </li>
              </ul>

              <Typography variant="h6" sx={{ mb: 1 }} style={{ fontSize: "16px", fontWeight: 700, color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                DON'TS
              </Typography>
              <ul className="ml-5 list-disc">
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Do not try and bite hard food with front Dentures
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Do not be abrasive while brushing
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Do not use a toothpick or pointed objects on Dentures
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Do not drop them as they are delicate and may break if you do so
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  If they loosen, do not try to fix it on your own instead visit a dentist
                </li>
              </ul>
            </div>
          </Box>

          {/* Section 6: Myths About Dentures */}
          <Box id="myths" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div bg-gray-50 rounded-xl p-6">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Myths About Dentures
                </Typography>
              </div>
              <ul className="ml-5 list-disc">
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#333" }}>It's difficult to eat with Dentures on</strong> – There are no restrictions on what kind of food to eat. Initially, you might be advised to intake certain kind of diet but with time you will be able to eat whatever you wish but precautions are necessary.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#333" }}>Lifetime Solution</strong> – If not taken proper care, the dentures may not last for long. Also, over a period they may start to wear down, loosen their natural appearance and chewing ability.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#333" }}>People might know if someone is wearing Dentures</strong> – Gone are the days when they were highlighted. The material used to make dentures is such that nobody could guess that you are wearing dentures. But if they are coming to notice then it is advised to visit a dentist.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#333" }}>Do not require proper care</strong> – Though artificial, dentures work exactly like your real teeth, therefore, it is extremely important to take care of dentures the way you take care of your teeth.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#333" }}>Can be repaired by self</strong> – Never ever should a person try the same. If you feel that your dentures are no longer fitting the way they should, do not try to get them fixed on your own as this may further damage your dentures.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "14px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  <strong style={{ color: "#333" }}>No further visits to the Dentist</strong> – Your oral health does not include only your teeth but also gums, tongue, and tissues. Regular visits to the dentist will ensure everything is being taken care of. Also, he/she can examine the dentures and may advise if you need to change them.
                </li>
              </ul>
            </div>
          </Box>

          {/* Section 7: Cost */}
          <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Cost Of Partial Dentures
                </Typography>
              </div>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                The cost of partial dentures varies depending on a variety of factors, including the materials used, the number of teeth replaced, and the process of making the dentures. You may also require dental treatment prior to partial dentures. In such cases, the cost may marginally increase.
              </Typography>
            </div>
          </Box>

          {/* Section 8: FAQs */}
          <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
            <div className="section-div bg-gray-50 rounded-xl p-6">
              <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
                <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                  Frequently Asked Questions
                </Typography>
              </div>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                  Q.1. Why Is It Important to Remove Dentures at Night?
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                  In order to allow gums and bones to relax at night time, removing denture is advised by dentists. Removing bottom or top dentures also allow the gum to come in contact with saliva considered good for the oral health of an individual. Get all the necessary information about dentures at your nearest 2HF India clinic.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                  Q.2. Can One Sleep with Dentures On?
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                  Yes, one can sleep with dentures on. But, for best results and good oral health, it is advised by dentists to remove dentures before sleeping to give space for bones and gums to relax. Since dentures cost a good sum of money, taking good care of them is important.
                </Typography>
              </Box>

              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }} style={{ fontSize: "14px", color: "#003366", fontFamily: "'Poppins', sans-serif" }}>
                  Q.3. Do Dentures Hurt?
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                  No, dentures do not hurt at all. It is only at the beginning that patients may feel a little discomfort or uneasiness as they are not used to custom dentures in the mouth.
                </Typography>
              </Box>
            </div>
          </Box>

        </div>
      </Container>
    </>
  );
};

export default DenturesPage;
