/**
 * Patient Login Page
 *
 * Login redesigned — phone-first, navy primary, OTP hidden behind flag — 2026-07-04
 *
 * Login methods:
 * 1. WhatsApp OTP (default) — phone, then a 6-digit code
 * 2. Password (transition fallback) — retained until OTP is confirmed live
 *
 * The legacy EMAIL-OTP flow was retired (backend now answers 410).
 */
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import {
  loginWithPassword,
  forgotPassword,
  requestWhatsappOtp,
  verifyWhatsappOtp,
} from "../../api/auth.api";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { GTAG_CONVERSIONS } from "../../utils/gtagConversions";
import { DEMO_LOGIN } from "../../demo/flag";

const fireBookAppointmentConversion = () => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", { send_to: GTAG_CONVERSIONS.BOOK_APPOINTMENT });
  }
};

// Field style — navy focus ring instead of orange
const fieldCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 outline-none transition-colors focus:border-[#0d1b4a] focus:ring-2 focus:ring-[#0d1b4a]/20";

const trustPoints = [
  "Book appointments online",
  "View treatment history",
  "Manage your dental health",
];

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Optional post-login destination, e.g. /login?redirect=/membership-plans
  const redirect = searchParams.get("redirect");
  const login = useAuthStore((state) => state.login);

  // Email is still used by the forgot-password (reset link) flow.
  const [email, setEmail] = useState("");

  // Password tab state — phone-first
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState(DEMO_LOGIN?.patientPhone ?? "");
  const [password, setPassword] = useState(DEMO_LOGIN?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState("");

  // --- WhatsApp OTP login (the default flow; password is now the fallback) ---
  // usePassword=true switches to the legacy password form during transition.
  const [usePassword, setUsePassword] = useState(false);
  const [otpStep, setOtpStep] = useState("phone"); // "phone" | "code"
  const [otpCode, setOtpCode] = useState("");
  const [resendIn, setResendIn] = useState(0); // seconds until Resend re-enables
  // Shown INLINE on the code-entry step (not as a toast) so it stays readable
  // while the patient waits for the message and can act on the guidance.
  const [otpNotice, setOtpNotice] = useState("");

  // Countdown driving the Resend button. Mirrors the backend's 60s per-phone
  // cooldown so the UI never invites a request the server will reject.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const validatePhone = () => {
    if (!phone) return "Please enter your phone number";
    if (phone.length !== 10) return "Phone number must be 10 digits";
    if (countryCode === "+91" && !/^[6-9]\d{9}$/.test(phone)) {
      return "Enter a valid 10-digit Indian mobile number starting with 6–9";
    }
    return null;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    const invalid = validatePhone();
    if (invalid) {
      setError(invalid);
      return;
    }

    setLoading(true);
    try {
      const res = await requestWhatsappOtp(phone);
      setOtpStep("code");
      setOtpCode(DEMO_LOGIN?.otp ?? "");
      setResendIn(60);
      // Surfaced inline and persistently, NOT as a toast -- the message tells
      // the patient what to do if nothing arrives, which is useless if it
      // vanishes after two seconds. Uses the server's own wording, which is
      // deliberately identical for registered and unregistered numbers: we
      // must never imply whether the account exists.
      setOtpNotice(
        res?.message ||
          "If this number is registered with us, you'll receive a login code on WhatsApp within a minute. Didn't receive it? Please check the number, or call us at +91-9467776028."
      );
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 429) {
        // Rate limited -- surface the wait, and start the countdown from the
        // server's own retryAfter so the UI and backend agree.
        const wait = err.response?.data?.errors?.retryAfterSec;
        if (wait) setResendIn(wait);
        setError(msg || "Please wait before requesting another code.");
        setOtpStep("code"); // a code may already be in their hand
      } else if (!err.response) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(msg || "Could not send the code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Enter the 6-digit code sent to your WhatsApp");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyWhatsappOtp(phone, otpCode.trim());
      // Identical to the password path -- same store call, same redirect.
      login(response.data.patient, response.data.token);
      navigate(redirect || "/dashboard", { replace: true });
    } catch (err) {
      if (!err.response) {
        setError("Network error. Please check your connection and try again.");
      } else {
        // The backend already returns precise, safe copy here: wrong code with
        // attempts remaining, too many attempts, or expired.
        setError(err.response?.data?.message || "That code was not accepted.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Password handler ---

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone) {
      setError("Please enter your phone number");
      return;
    }
    if (phone.length !== 10) {
      setError("Phone number must be 10 digits");
      return;
    }
    // Indian mobile validation — only when +91
    if (countryCode === "+91" && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number starting with 6–9");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    // Backward-compatible: send plain 10-digit phone for +91 (existing records);
    // prepend country code for other countries.
    const identifierToSend = countryCode === "+91" ? phone : `${countryCode}${phone}`;

    setLoading(true);
    try {
      const response = await loginWithPassword(identifierToSend, password);
      login(response.data.patient, response.data.token);
      navigate(redirect || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot password handler (email-based, unchanged) ---

  // Still used by the forgot-password flow, which is genuinely email-based
  // (a reset LINK, not an OTP) and is unaffected by the email-OTP retirement.
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return null;
    }
    return email.toLowerCase();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const validEmail = validateEmail();
    if (!validEmail) return;
    setLoading(true);
    try {
      await forgotPassword(validEmail);
      toast.success("If an account exists for this email, a password reset link has been sent.");
      setForgotMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <title>Patient Login | Dental Clinic</title>
      <meta
        name="description"
        content="Login to your Dental Clinic patient portal to view appointments, treatment history, invoices, and manage your dental health records securely online."
      />
      <link rel="canonical" href="https://dentalclinic.example.com/login" />
      <meta name="robots" content="noindex, follow" />
      <meta property="og:title" content="Patient Login | Dental Clinic" />
      <meta
        property="og:description"
        content="Login to your Dental Clinic patient portal to view appointments, treatment history, and manage your dental health."
      />
      <meta property="og:url" content="https://dentalclinic.example.com/login" />
      <meta
        property="og:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Patient Login | Dental Clinic" />
      <meta
        name="twitter:description"
        content="Login to your Dental Clinic patient portal to view appointments and manage your dental health."
      />
      <meta
        name="twitter:image"
        content="https://dentalclinic.example.com/dental-clinic-logo.png"
      />

      {/* Left branding panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#0D1B4A] to-[#060c28] flex-col items-center justify-center text-center px-12">
        <div>
          {/* Logo on desktop panel */}
          <img
            src="/dental-clinic-logo.png"
            alt="Dental Clinic"
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
          <p className="text-gray-300 text-[13px] tracking-wide">
            CARING FOR YOUR SMILE
          </p>
          <div className="mt-8 space-y-3 text-left inline-block">
            {trustPoints.map((point) => (
              <p
                key={point}
                className="text-gray-300 text-[14px] flex items-center gap-2"
              >
                <span className="text-accent">✓</span>
                {point}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[45%] bg-white flex items-center justify-center px-6 sm:px-[40px] py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-block text-[14px] text-gray-500 hover:text-[#0d1b4a] no-underline transition-colors mb-6"
          >
            ← Back to Home
          </Link>

          {/* Logo on mobile (desktop shows it on the left panel) */}
          <div className="lg:hidden flex justify-center mb-4">
            <img
              src="/dental-clinic-logo.png"
              alt="Dental Clinic"
              className="h-12 w-auto object-contain"
            />
          </div>

          <h1 className="text-[#0d1b4a] text-2xl font-bold">Patient Portal</h1>

          {!forgotMode && (
            <>
              {/* ---- WhatsApp OTP login (default) ---- */}
              {!usePassword && (
                <div className="mt-5">
                  {otpStep === "phone" ? (
                    <form onSubmit={handleSendOtp}>
                      <div className="flex gap-2 mb-4">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          disabled={loading}
                          className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-[15px] text-gray-800 outline-none transition-colors focus:border-[#0d1b4a] focus:ring-2 focus:ring-[#0d1b4a]/20 cursor-pointer shrink-0"
                          aria-label="Country code"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+971">🇦🇪 +971</option>
                        </select>
                        <input
                          type="tel"
                          inputMode="numeric"
                          className={fieldCls}
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          disabled={loading}
                          autoComplete="tel"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-1 flex items-center justify-center bg-[#0d1b4a] hover:bg-[#0d1b4a]/90 disabled:opacity-70 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Send OTP"}
                      </button>
                      <p className="text-[13px] text-gray-400 text-center mt-3">
                        We'll send a 6-digit code to your WhatsApp
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp}>
                      {/* Persistent guidance -- stays visible while they wait */}
                      {otpNotice && (
                        <div className="mb-4 rounded-xl border border-[#0d1b4a]/15 bg-[#0d1b4a]/[0.04] px-4 py-3">
                          <p className="text-[13px] leading-relaxed text-gray-700">
                            {otpNotice}
                          </p>
                        </div>
                      )}

                      <p className="text-[13px] text-gray-600 mb-3 text-center">
                        Sent to{" "}
                        <span className="font-semibold text-gray-800">
                          {countryCode} {phone}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setOtpStep("phone"); setError(""); setOtpCode(""); setOtpNotice(""); }}
                          className="ml-2 text-accent font-semibold hover:text-accent-dark cursor-pointer bg-transparent border-0"
                        >
                          Change
                        </button>
                      </p>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className={`${fieldCls} text-center tracking-[0.5em] text-[20px] font-semibold`}
                        placeholder="------"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        disabled={loading}
                        autoComplete="one-time-code"
                        autoFocus
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-5 flex items-center justify-center bg-[#0d1b4a] hover:bg-[#0d1b4a]/90 disabled:opacity-70 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Verify & Login"}
                      </button>

                      {/* Resend, gated by the same 60s cooldown the backend enforces */}
                      <p className="text-[13px] text-gray-500 text-center mt-3">
                        {resendIn > 0 ? (
                          <>Resend code in {resendIn}s</>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="text-accent font-semibold hover:text-accent-dark cursor-pointer bg-transparent border-0 disabled:opacity-60"
                          >
                            Resend code
                          </button>
                        )}
                      </p>
                    </form>
                  )}

                  {/* Transition fallback -- backend keeps password login alive */}
                  <p className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => { setUsePassword(true); setError(""); setOtpNotice(""); }}
                      className="text-[13px] text-gray-500 hover:text-gray-700 underline cursor-pointer bg-transparent border-0"
                    >
                      Login with password instead
                    </button>
                  </p>
                </div>
              )}

              {/* ---- Password login (transition fallback) ---- */}
              {usePassword && (
                <form onSubmit={handlePasswordSubmit} className="mt-5">
                  {/* Phone input with country-code selector */}
                  <div className="flex gap-2 mb-4">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-[15px] text-gray-800 outline-none transition-colors focus:border-[#0d1b4a] focus:ring-2 focus:ring-[#0d1b4a]/20 cursor-pointer shrink-0"
                      aria-label="Country code"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit phone number"
                      value={phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(digitsOnly);
                        if (error) setError("");
                      }}
                      onKeyDown={(e) => {
                        if (
                          !/[0-9]/.test(e.key) &&
                          !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
                          !((e.metaKey || e.ctrlKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase()))
                        ) {
                          e.preventDefault();
                        }
                      }}
                      className={fieldCls + " flex-1"}
                      aria-label="Phone number"
                      autoComplete="tel-national"
                      disabled={loading}
                    />
                  </div>

                  {/* Password field */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`${fieldCls} pr-12`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <VisibilityOff className="text-[20px]!" />
                      ) : (
                        <Visibility className="text-[20px]!" />
                      )}
                    </button>
                  </div>

                  {/* Inline error */}
                  {error && (
                    <p className="text-[13px] text-red-500 mt-2">{error}</p>
                  )}

                  {/* Primary CTA — navy */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-5 flex items-center justify-center bg-[#0d1b4a] hover:bg-[#0d1b4a]/90 disabled:opacity-70 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Login"}
                  </button>
                  <p className="text-[13px] text-gray-400 text-center mt-3">
                    Enter your registered phone number with your password
                  </p>
                  <p className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => { setUsePassword(false); setError(""); setOtpStep("phone"); setOtpNotice(""); }}
                      className="text-[13px] text-gray-500 hover:text-gray-700 underline cursor-pointer bg-transparent border-0"
                    >
                      Login with WhatsApp OTP instead
                    </button>
                  </p>
                </form>
              )}

              {/* Forgot password link — orange accent (deliberate) */}
              <p className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(""); }}
                  className="text-[13px] text-accent font-semibold hover:text-accent-dark cursor-pointer bg-transparent border-0"
                >
                  Forgot Password?
                </button>
              </p>
            </>
          )}

          {/* Forgot password view */}
          {forgotMode && (
            <form onSubmit={handleForgotSubmit} className="mt-6">
              <h2 className="text-[#0d1b4a] text-lg font-bold mb-1">
                Reset your password
              </h2>
              <p className="text-[14px] text-gray-600 mb-4">
                Enter your registered email and we'll send you a reset link.
              </p>
              <input
                type="email"
                className={fieldCls}
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 flex items-center justify-center bg-[#0d1b4a] hover:bg-[#0d1b4a]/90 disabled:opacity-70 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Send Reset Link"}
              </button>
              <p className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-[13px] text-gray-500 hover:text-[#0d1b4a] cursor-pointer bg-transparent border-0"
                >
                  ← Back to login
                </button>
              </p>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[13px] text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Book Appointment — orange accent CTA (deliberate) */}
          <div className="text-center">
            <p className="text-[14px] text-gray-500 mb-2">
              New patient? Book your first appointment
            </p>
            <Link
              to="/book-appointment"
              onClick={fireBookAppointmentConversion}
              className="w-full inline-flex items-center justify-center gap-2 border-2 border-accent text-accent hover:bg-accent hover:text-white rounded-xl py-3 text-[15px] font-semibold no-underline transition-colors duration-200"
            >
              <CalendarMonthIcon className="text-[20px]!" />
              Book Appointment
            </Link>
          </div>

          {/* Admin Login */}
          <p className="text-center text-[14px] text-gray-500 mt-6">
            Staff?{" "}
            <Link
              to="/admin/login"
              className="text-accent font-semibold no-underline hover:text-accent-dark"
            >
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
