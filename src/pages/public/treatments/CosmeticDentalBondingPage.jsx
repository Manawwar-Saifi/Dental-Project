import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "cosmatic-dental-bonding", label: "COSMATIC DENTAL BONDING" },
  { id: "procedure", label: "COSMETIC DENTAL BONDING PROCEDURE" },
  { id: "lifespan", label: "THE LIFESPAN OF BONDED TEETH" },
  { id: "post-care", label: "POST CARE FOR DENTAL BONDING" },
  { id: "cost", label: "COST OF COSMETIC BONDING" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const CosmeticDentalBondingPage = () => {
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
            Cosmatic Dental Bonding <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/cosmatic-dental-bonding.png"
                  alt="Cosmatic Dental Bonding"
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
                    <option value="cosmetic-bonding">Cosmetic Dental Bonding</option>
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
              Cosmatic Dental Bonding
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            2HF India has many ways to resolve decayed teeth, cracked or chipped teeth, gaps, tooth discoloration, short teeth. Tooth-coloured Dental Filling and Dental Bonding (cosmetic Bonding) procedures are the basic procedures to solve these defects.
          </Typography>
        </Box>

        {/* Section 1: Cosmatic Dental Bonding (Detailed) */}
        <Box id="cosmatic-dental-bonding" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Cosmatic Dental Bonding
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            2HF India has many ways to resolve decayed teeth, cracked or chipped teeth, gaps, tooth discoloration, short teeth. Tooth-coloured Dental Filling and Dental Bonding (cosmetic Bonding) procedures are the basic procedures to solve these defects. Both the Dental Filling and Dental Bonding work on functionality and helps to prolong the life of the tooth, in addition to that the bonding delivers a cosmetic element by improving the appearance.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Bonding of tooth-colored composite resin can be an affordable option in comparison to porcelain veneers. A filling should not cause any discomfort, it is shaped and polished to match the contours and bite of your natural teeth. Another advantage to bonding is that compared to veneers and crowns, it requires little to no removal of tooth enamel and It can usually be done in one short office visit unless multiple teeth are involved.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            There are two forms of dental bonding: direct composite bonding and adhesive bonding. In Direct composite bonding, a tooth-coloured composites are used to fill cavities, repair chips or cracks, close gaps between your teeth and build up the worn-down edges of teeth. In the dental world, these are called direct composite veneers but generically known by most to be called "bonding." Adhesive bonding, as opposed to direct composite bonding, is the process of attaching a restoration to a tooth. This method is commonly used for esthetic crowns, porcelain veneers, bridges, and inlays/Onlays.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The main limitation of bonding is that it is not as strong as other restorative procedures, such as crowns, veneers, or fillings. and also not as stain resistant as crowns. it is not suitable for crooked teeth or very weak or broken down teeth.
          </Typography>
        </Box>

        {/* Section 2: Cosmetic Dental Bonding Procedure */}
        <Box id="procedure" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Cosmetic Dental Bonding Procedure
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental bonding takes little to no preparation, and the use of anesthesia is often not necessary unless the bonding is being used to fill a decayed tooth. 2hf will conduct a thorough examination of your teeth that may involve x-rays and an evaluation of your teeth and gums before starting the procedure. We recommend that you bleach your teeth before starting the bonding process.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Composite veneers cover the facial surface of teeth to change tooth color, position, or shape. The addition of composite to tooth structure increases tooth size and therefore, there is often tooth reduction to make room for composite placement. The amount of reduction is determined by the position of the original tooth with the desired position and color of tooth structure to the thickness of composite materials required to block out the colour.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            A local anesthetic is used to numb the area, helping to mask any pain that could be felt when the dentist begins to remove decayed, or structurally unsound portions, of a natural tooth and then roughen the surface of the tooth and apply a conditioning liquid. Once the tooth is prepared, the tooth-colored putty-like resin is applied to the tooth, then molded and smoothed until it's in the desired shape. The material is then hardened with ultraviolet curing light. It can then be polished and shaped to look like the rest of the teeth. We can provide a bright, healthy, and strong smile with these exciting new techniques in adhesion dentistry.
          </Typography>
        </Box>

        {/* Section 3: The Lifespan Of Bonded Teeth */}
        <Box id="lifespan" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                The Lifespan Of Bonded Teeth
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The lifespan of bonding materials for the teeth depends on how much bonding was done and your oral habits. Generally, a well bonded tooth will last for 5 to 6 years. However, the lifespan of these restorations depends on your commitment to effective and regular dental care. Bonded teeth require the same care as your natural teeth. Biting your fingernails, chewing on pens, ice, or other hard food objects should be avoided. Also, if you smoke or drink a lot of dark beverages, such as coffee or red wine, your bonding material will stain more quickly and need replacement sooner.
            </Typography>
          </div>
        </Box>

        {/* Section 4: Post Care For Dental Bonding */}
        <Box id="post-care" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Post Care For Dental Bonding
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Tooth-colored fillings and cosmetic bonding often last several years before they need replacement. Brushing at least twice a day and flossing are good ways to keep good oral health. See your dentist every 6 months for regular professional checkups and cleanings.
          </Typography>
        </Box>

        {/* Section 5: Cost Of Cosmetic Bonding */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Cost Of Cosmetic Bonding
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Costs of tooth bonding vary depending on your specific dental conditions, amount of teeth that need cosmetic repair, additional procedures performed in conjunction, etc. With larger multiple teeth cases we can reduce the overall cost per tooth.
          </Typography>
        </Box>

      </Container>
    </>
  );
};

export default CosmeticDentalBondingPage;
