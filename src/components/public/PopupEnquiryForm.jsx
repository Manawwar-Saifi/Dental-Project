import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { filterName, NAME_PLACEHOLDER } from "../../utils/nameInput";

const DEFAULT_CONFIG = {
  enabled: true,
  delaySeconds: 30,
  pages: ["/", "/treatments", "/contact", "/membership-plans", "/book-appointment"],
  showOnAllPages: true,
};

const STORAGE_KEY = "popup_enquiry_submitted";
const DISMISSED_KEY = "popup_enquiry_dismissed";
// Once dismissed, stay hidden for 24 hours.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const PopupEnquiryForm = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", treatment: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const captchaRef = useRef(null);
  const timerRef = useRef(null);
  // Show at most once per page session (survives in-app navigation).
  const shownThisSessionRef = useRef(false);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("popup_config");
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!config.enabled) return;

    // Already shown once this session — don't show again until a full reload.
    if (shownThisSessionRef.current) return;

    // Never show again once an enquiry has been submitted.
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Respect the 24h cooldown after the popup was last dismissed.
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY)) || 0;
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;

    if (!config.showOnAllPages) {
      const currentPath = location.pathname;
      const isAllowed = config.pages.some(
        (p) => currentPath === p || currentPath.startsWith(p + "/")
      );
      if (!isAllowed) {
        setVisible(false);
        return;
      }
    }

    timerRef.current = setTimeout(() => {
      shownThisSessionRef.current = true;
      // Start the 24h cooldown the moment it's shown, so it won't reappear
      // on the next visit/reload even if the user never clicks the × button.
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
      setVisible(true);
    }, (config.delaySeconds || 30) * 1000);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname, config]);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.info("Please fill Name and Phone");
      return;
    }
    if (!captchaToken) {
      toast.info("Please complete the reCAPTCHA verification.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/enquiries", {
        name: form.name,
        phone: form.phone,
        email: form.email,
        treatmentName: form.treatment || "General Enquiry",
        source: { page: location.pathname, referrer: "Popup Form" },
      });
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
      toast.success("Enquiry submitted! We will call you back soon.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-[#eef6fb] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white cursor-pointer transition-colors z-10"
        >
          <CloseIcon style={{ fontSize: "18px", color: "#333" }} />
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-6 pb-2">
          <img
            src="/dental-clinic-logo.png"
            alt="Dental Clinic"
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Title */}
        <div className="text-center px-6 pb-4">
          <h2
            className="text-[#003366]"
            style={{ fontSize: "1.3rem", fontWeight: 800, fontStyle: "italic", fontFamily: "'Poppins', sans-serif" }}
          >
            Didn't Find What You Were Looking for!
          </h2>
          <p
            className="text-[#c26e1a]"
            style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}
          >
            Get a call back from Expert Dentist
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={NAME_PLACEHOLDER}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: filterName(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-[#1a8fc4] outline-none focus:border-[#003366] transition-colors bg-white"
                style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-[#1a8fc4] outline-none focus:border-[#003366] transition-colors bg-white"
                style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-[#1a8fc4] outline-none focus:border-[#003366] transition-colors bg-white"
              style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
            />
            <select
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-[#1a8fc4] outline-none focus:border-[#003366] transition-colors bg-white text-gray-500"
              style={{ fontSize: "14px", fontFamily: "'Poppins', sans-serif" }}
            >
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
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-[#003366] text-white rounded-full uppercase tracking-wide cursor-pointer hover:bg-[#004080] transition-colors disabled:opacity-60"
              style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupEnquiryForm;
