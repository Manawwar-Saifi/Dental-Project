import { useState, useRef } from "react";
import { Box, Typography, Container } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import BreadcrumbBanner from "../../../components/public/BreadcrumbBanner";
import submitEnquiry from "../../../utils/submitEnquiry";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import { toast } from "react-toastify";

const navSections = [
  { id: "kids-dentistry", label: "KIDS DENTISTRY" },
  { id: "why-kids-specialist", label: "WHY DO WE NEED A KIDS SPECIALIST?" },
  { id: "treatment-modalities", label: "WHAT TREATMENT MODALITIES ARE OFFERED BY THE PEDIATRIC DENTIST" },
  { id: "treatment-options", label: "TREATMENT OPTIONS FOR KIDS" },
  { id: "oral-habits", label: "ORAL HABITS IN CHILDREN" },
  { id: "prevention-treatments", label: "PREVENTION TREATMENTS FOR KIDS" },
  { id: "cost", label: "WHAT TO PAY FOR KIDS' DENTISTRY SERVICES?" },
  { id: "faqs", label: "FREQUENTLY ASKED QUESTIONS" },
];

const handleScrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const KidsDentistryPage = () => {
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
            Kids Dentistry <span style={{ fontSize: "14px" }}>&#8599;</span>
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
                  src="/images/kid-dentistry.png"
                  alt="Kids Dentistry"
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

        {/* Section 1: Kids Dentistry */}
        <Box id="kids-dentistry" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Kids Dentistry
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Humans start teething when they are as young as 6 months old and develop their set of primary 'milk' teeth.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            At the age of 6-7 years, humans start losing their milk teeth and the permanent set of teeth start emerging. Because the milk teeth will eventually fall off, some parents tend to ignore taking their child to a dentist.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            However, these milk teeth form the basis of developing permanent teeth. If proper care is not taken the problems can emerge which will last a lifetime. In recent years the cases of caries in children have grown manifold. Therefore, it is always advised to start taking care of your baby's teeth in the very early stages of their life. This includes setting Oral Hygiene routine and regular visits to pediatric dentist.
          </Typography>
        </Box>

        {/* Section 2: Why Do We Need A Kids Specialist? */}
        <Box id="why-kids-specialist" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Why Do We Need A Kids Specialist?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Kids Dentist or Pediatric Dentist are trained to take care of dental complexities of kids and teens. Pediatric dentistry is a separate field dedicated to kids, their Oral Health prevention and preparation for the future.
          </Typography>
        </Box>

        {/* Section 3: What Treatment Modalities (gray bg) */}
        <Box id="treatment-modalities" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                What Treatment Modalities Are Offered By The Pediatric Dentist
              </Typography>
            </div>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Pediatric Dentist work towards maintaining good oral health in kids. The treatment provided by them includes:
            </Typography>
            <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Examination of infants and teens. It includes the oral caries assessment in mothers and their kids
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                They are an expert is protecting your kids' teeth by doing a fluoride treatment
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Habit counseling in which the doctors help to keep the habits of kids in control
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Correction of crooked and misaligned teeth
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Treatment of tooth cavities
              </li>
              <li style={{ fontSize: "14px", color: "#555", marginBottom: "10px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                Treatment of dental injuries
              </li>
            </ul>
          </div>
        </Box>

        {/* Section 4: Treatment Options For Kids */}
        <Box id="treatment-options" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Treatment Options For Kids
            </Typography>
          </div>
          <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px", textDecoration: "underline" }}>
            Root Canal Treatment In Milk Teeth
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            If you think your child is too young to need root canal treatment, think again — there is no age limit for this treatment. If his/her primary (baby) teeth have been injured, or if decay has advanced deep into the roots of your child's teeth, a root canal treatment to stabilize teeth may be needed. Root canal treatment removes the infection from the pulp, the living tissue that is found inside the tooth's roots. The pulp contains the tooth's nerves, so tooth pain is often an indication that decay has moved into the pulp. Root canal treatment is a simple procedure wherein instruments are used to clean the root canals of teeth followed by inserting a medication so as to maintain the teeth properly in the oral cavity.
          </Typography>
        </Box>

        {/* Section 5: Oral Habits In Children */}
        <Box id="oral-habits" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              Oral Habits In Children
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Frequently children acquire certain habits that may either temporarily or permanently be harmful to teeth and tooth supporting structures. These habits are acquired as a result of repetition. In the initial stages, there is a conscious effort to perform the act. Later the act becomes less conscious and if repeated often enough may enter the realms of unconsciousness. Some common oral habits seen in children include thumb sucking, mouth breathing, tongue thrusting, lip biting, grinding of teeth and nail-biting.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Certain reminding appliances called <span style={{ fontWeight: 700, fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>habit breaking appliances</span> assist the child who is willing to quit the habit but is not able to do so as the habit has entered the subconscious level. They may be removable or fixed appliances. Common Appliances in Pediatric Dentistry:
          </Typography>
          <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Twin Block</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Frankly</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Habit Breaking appliances</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Space Maintainers</li>
            <li style={{ fontSize: "14px", color: "#555", marginBottom: "8px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Head Gear</li>
          </ul>
        </Box>

        {/* Section 6: Prevention Treatments For Kids (gray bg) */}
        <Box id="prevention-treatments" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Prevention Treatments For Kids
              </Typography>
            </div>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
              Fluoride Application
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              A common problem for which parents usually take their children to the dentist is decay. This is because there is a lack of proper dexterity of brushing in children. To avoid the problem of decay, parents should get the Fluoride application treatment in children at regular intervals. Fluoride helps to fight plaque and bacteria which can cause enamel loss which further causes cavities. Fluoride also strengthens the tooth structure & helps in bone growth. Under this treatment, the dentist incorporates fluoride ions into the tooth structure making them more prone to acid dissolution. This treatment is equally useful for both milk & permanent teeth.
            </Typography>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
              Sealants
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              The main reason for decay is the food and bacteria that is trapped in the pits & fissures of teeth. We chew food from the back teeth like molars and premolars which are never flat. The pits & fissures as discussed above are the depressions on these back teeth. They function as potential traps for bacteria & food and make it susceptible to decay. Therefore, as a preventive measure, certain pits and fissure sealants are placed. Dental sealants then come to the rescue. Sealants are plastic coatings placed on the chewing surface of the permanent tooth. They protect the tooth from decay. Because of fissures the permanent back teeth, molars, and premolars are vulnerable to decay. As we talked about the habits, it is important to inculcate the habit of maintaining good oral health at a very initial stage. This is an investment which will pay lifelong dividends in the form of healthy teeth and a healthy lifestyle. Parents should take initiatives to teach their children the correct technique of brushing and for that, it is highly important that they themselves should know the correct way of brushing. Make brushing a fun-filled activity for your child, brush along with them and encourage them to take preventive actions.
            </Typography>

            <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif", marginBottom: "4px" }}>
              Toothpaste And Toothbrush
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
              Apart from the aforementioned treatment options, make sure that your kids brush twice daily. Brushing before sleeping is extremely important because the food you eat during the day get stuck between your teeth and bacteria in your mouth will feed on that food overnight causing decay. If possible teach your child how to floss as it is the added protection for your teeth
            </Typography>
          </div>
        </Box>

        {/* Section 7: What To Pay For Kids' Dentistry Services? */}
        <Box id="cost" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
            <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
              What To Pay For Kids' Dentistry Services?
            </Typography>
          </div>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
            Pediatric dental visits cost a little less than adult visits generally. For most of the services like cleaning and common checkup, the prices are affordable. However, some dental treatments can be marginally higher in cost if your child's dental health is not immaculate. You can learn more about them in detail by visiting any of our dental clinics in India. 2HF has experienced specialists for kids dental care right in your neighborhood. Ideally, it is advised that a child's first dental visit should be planned when the first tooth erupts
          </Typography>
        </Box>

        {/* Section 8: Frequently Asked Questions (gray bg) */}
        <Box id="faqs" sx={{ mb: 5, scrollMarginTop: "100px" }}>
          <div className="bg-gray-50 rounded-xl p-6">
            <div style={{ borderLeft: "4px solid #003366", paddingLeft: "12px", marginBottom: "16px" }}>
              <Typography variant="h5" style={{ fontSize: "20px", fontWeight: 700, color: "#003366", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.1. What Is The Minimum Age For Visiting A Kid's Dentist?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                You should take your child to the pediatric dentist as soon as the first tooth erupts in their mouth, or right around the time your child turns one. Book an appointment with an expert at your nearest 2hf Clinic for pediatric consultation.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.2. How Long Should A Child Visit A Pediatric Dentist?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                It is mandatory for a child to see a pediatric dentist till the age of 14, because by this time, all of their permanent teeth have grown out. Beyond this, it is the choice of the child and his/her parents. However, it is recommended that a child should visit a pediatric dentist till the age of 16.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.3. When Should A Child Start Brushing?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                For children, brushing should start with the eruption of the first tooth. However, expert kids dentist advice to make sure that the amount of toothpaste should be very small, almost equivalent to a grain of rice.
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.4. Should Mothers Clean The Mouth Of Babies If There Are No Teeth?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                It is extremely important to maintain oral hygiene and keep the mouth clean & clear of germs, irrespective of the age. Mothers can clean the mouth, both upper and lower jaw, of their children with the help of a soft cloth
              </Typography>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.5. Is It Normal For Babies To Have A White Tongue?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                Most babies have a white coating on their tongue in the initial few weeks, which is completely normal. There is nothing wrong with their oral hygiene.
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle1" style={{ fontSize: "14px", fontWeight: 700, color: "#333", fontFamily: "'Poppins', sans-serif" }}>
                Q.6. What Is The Importance Of Milk Teeth?
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 1 }} style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}>
                As milk teeth erupt and fall, people often think that they do not matter in the overall part of oral hygiene. However, milk teeth play some really important roles, like:
              </Typography>
              <ul style={{ marginLeft: "20px", listStyleType: "disc" }}>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  They play the primary role of biting, chewing, and grinding the food before digesting it
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  They are also important in speech patterns and training
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  Milk teeth are the basis of the development of the jaw bones and muscles.
                </li>
                <li style={{ fontSize: "14px", color: "#555", marginBottom: "6px", lineHeight: 1.7, fontFamily: "'Poppins', sans-serif" }}>
                  They provide the necessary shape of the mouth and room for permanent teeth to erupt.
                </li>
              </ul>
            </div>
          </div>
        </Box>

      </Container>
    </>
  );
};

export default KidsDentistryPage;
