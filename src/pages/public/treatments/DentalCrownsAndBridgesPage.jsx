import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "dental-crowns-bridges", label: "DENTAL CROWNS AND BRIDGES" },
  { id: "types-of-crowns", label: "WHAT ARE VARIOUS TYPES OF DENTAL CROWNS?" },
  { id: "dos-and-donts", label: "DO'S AND DON'TS WITH DENTAL CROWNS" },
  { id: "myths", label: "MYTHS ABOUT DENTAL CROWNS" },
  { id: "cost", label: "HOW MUCH DO I HAVE TO PAY FOR DENTAL BRIDGES AND CROWNS?" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const DentalCrownsAndBridgesPage = () => {
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
            Dental Crowns And Bridges <span style={{ fontSize: "14px" }}>&#8599;</span>
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
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-[#111] p-4">
                <img
                  src="/images/dental-crown-and-bridges.png"
                  alt="Dental Crowns And Bridges"
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
                    <option value="kids-dentistry">Kids Dentistry</option>
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

        {/* Section 1: Dental Crowns And Bridges */}
        <Box id="dental-crowns-bridges" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Dental Crowns And Bridges
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental Crowns are a tooth-shaped cap which is placed on the tooth to restore the shape, size, and appearance of the tooth. It also enhances the strength of the tooth. If the major part of the tooth is missing, then the crown is the best solution for it. By placing the crown, a tooth can function normally again,
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental crowns are used as caps on missing or fractured tooth to protect the life of your teeth. Dental Crowns are needed to:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc", marginBottom: "16px" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Protect or restore a tooth from fracturing due to accident or trauma
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Replace a tooth which is too large for a filling
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Get a cap over Implan t placed
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Restore the tooth on which RCT was performed
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Cover discolored, misshaped or badly formed tooth
            </li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
              Require a bridge in that case crowns are a must
            </li>
          </ul>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            In addition, Dental Crown gives your tooth the strength, shape, size and help to improve the appearance of your tooth. If your dentist has advised, you to get a crown and you are delaying the process then there are chances that you can damage your tooth to the extent that extraction is the last resort.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Moreover, not getting a dental crown can wear down other adjacent teeth causing damage.
          </Typography>
        </Box>

        {/* Section 2: What Are Various Types Of Dental Crowns? */}
        <Box id="types-of-crowns" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What Are Various Types Of Dental Crowns?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental Crowns can be made in variety come in various materials such as:
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Metal Crowns
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If someone is looking for long term and the durable solution then metal crowns are to the rescue. The gold crowns in these are the most used and bonds well with the tooth. These can even withstand hard chewing forces and biting. Being stronger they last longer and do not wear down easily. The only drawback is that they are visible from a distance hence, suitable only for molars.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Porcelain-Fused-To-Metal
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If you have aesthetic concerns and also wish to have metal crowns inserted then these are the best option available. The inside of the teeth is made up of metal and the outer portion of the crown is made of porcelain, as a result, it has the dual advantage – metal which provides strength and porcelain which matches with the color of the teeth making it look like natural teeth. They look the most like natural teeth.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Ceramic Crown
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If you do not want to have metal inserted inside your mouth but want the strength to match metal crowns then ceramic crowns are the best option available. Not only is the strong but blends more naturally with your tooth color making it unnoticed. It does not have any aesthetic concerns and is the best option for the front, back and even for the bridges. The problem of porcelain wearing down and metal being visible is solved by this Dental Crown. They may not be considered as an option for molars because forces applied while biting can wear down your teeth.
          </Typography>
        </Box>

        {/* Section 3: Do's And Don'ts (gray bg) */}
        <Box id="dos-and-donts" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Do's And Don'ts With Dental Crowns
              </Typography>
            </div>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>
              DO's
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc", marginBottom: "20px" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Since the natural teeth are still beneath the crown and are vulnerable to decay, therefore, it is important to maintain good oral hygiene therefore brushing, rinsing and flossing should be followed regularly.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                If you clench your teeth, then it is advised to use mouthguard to protect your crown and this also does not allow your teeth to wear down.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Get crowns only by a dental expert who is trained in placing dental implants. Poor placement of crowns can reduce the longevity of crowns.
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do visit your dentist every 6 months to ensure that your oral health is in the best care.
              </li>
            </ul>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "8px" }}>
              DON'TS
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not use your teeth as tools as this will put pressure and will damage the crown
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not bite your nails and chew pencils
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not chew ice or candy which is hard
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not eat sticky food
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Do not consume too hot or too cold food as this might cause sensitivity
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 4: Myths About Dental Crowns */}
        <Box id="myths" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Myths About Dental Crowns
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Dental Crowns carry a lot of myths with them a few of them are:
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Dental Crowns Do Not Look Natural
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            There is a misconception that dental crowns do not match with your teeth hence give the impression of an artificial tooth. However, with changes in technology crowns come in various material which looks exactly like your natural teeth. And even metal crowns are a good and viable option because they are used as molars and are never seen.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Crowns Last Forever
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Though the crowns are now stronger and have longevity, yet they cannot last a lifetime. It also depends as to how well they are taken care of. To ensure they last longer visit your dentist after every 6 months, your dentist will monitor your crown and will replace it timely.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Food And Beverage Stains The Crown
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The biggest myth that people carry. They believe that food and beverages can stain their teeth with time but in reality, the crowns are made of porcelain and ceramic which do not stain easily.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Only Used For Restorative Dentistry
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            People believe that one gets crown only if they have fractured tooth, have undergone root canal treatment or have broken or chipped a tooth. But the truth is they are used in cosmetic surgery as a way to enhance the appearance and to have a whiter and beautiful smile.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            Dental Crowns Do Not Break Or Chip
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Though ceramic and porcelain are harder substances yet if you bite on something extremely hard, or face accident or trauma then your crown may break.
          </Typography>

          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
            You Cannot Get Cavity With Crowns
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Because crown covers your tooth, therefore, they become vulnerable to decay. Though crowns, as they are artificial, have no chances of decay yet the part below them can decay. It is, therefore, required to keep your teeth and the area around clean to prevent a cavity.
          </Typography>
        </Box>

        {/* Section 5: Cost */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              How Much Do I Have To Pay For Dental Bridges And Crowns?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            The price of dental bridges and crowns depends on the type chosen by the patients. For example, you'll have to pay more for an all-porcelain bridge than for a metal bridge However, it is an affordable option and patients can also choose to pay the price in EMIs at 2HFclinic.
          </Typography>
        </Box>

        {/* Section 6: Frequently Asked Questions (gray bg) */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. What Is The Cost Of Dental Crowns?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Dental Crowns may be more expensive than fillings, but they have the advantage of actually lasting longer as well. At 2HF, we ensure that our patients always get the best quality and value for their money. Visit your nearest 2HF clinic for more information.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. How Long Does A Dental Crown Last?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Depending on several factors that include the case specifics, material, and compliance to oral hygiene routines, dental crowns may last anywhere between 5 to 15 years. We advise our patients to maintain their oral hygiene after implantation of dental crown.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. Do Dental Crowns Hurt?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Before the procedure, dentists administer a local anesthetic. Therefore getting dental crowns may not hurt. However, once the anesthetic wears off, feeling soreness and sensitivity in the gums is usual, and it usually goes away in a few days.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Do One Needs A Dental Crown After RCT?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Root Canal Treatment means that the pulp inside the tooth will be cleared out. Therefore to provide strength after filling up the cavity, crowns are usually used. Adding a crown to the tooth after RCT is a must.
              </Typography>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default DentalCrownsAndBridgesPage;
