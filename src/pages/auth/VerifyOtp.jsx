import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

/**
 * RETIRED: standalone email-OTP verification page.
 *
 * This page belonged to the legacy EMAIL OTP login, which has been retired --
 * it stored the code in plaintext, had no attempt cap or rate limiting, and
 * leaked account enumeration. The backend now answers 410 Gone on its
 * endpoints (/api/auth/patient/login, /verify-otp, /resend-otp).
 *
 * The replacement is WhatsApp OTP, which is a two-step flow handled INLINE on
 * the login page -- there is no separate verification screen any more.
 *
 * The route is kept (rather than deleted) purely so an old bookmark or a stale
 * cached bundle lands on the login page instead of a 404. Any ?redirect= is
 * preserved so the user still reaches where they were headed.
 */
const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    document.title = "Login — Dental Clinic";
  }, []);

  return (
    <Navigate
      to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
      replace
    />
  );
};

export default VerifyOtp;
