/**
 * Patient Reset Password Page (public)
 *
 * Reached from the reset link emailed to patients (/reset-password?token=xxx).
 * - Reads the reset token from the URL query string
 * - New password + confirm password inputs
 * - POSTs to /auth/reset-password (via resetPassword)
 * - On success: redirects to /login with a success toast
 *
 * Styled to match the patient Login page theme.
 */
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { resetPassword } from "../../api/auth.api";

const fieldCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-orange-200";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mirrors the backend rule: min 10 chars, at least one letter and one number.
  const validate = () => {
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error(
        "Password must be at least 10 characters and include a letter and a number",
      );
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset link. Please request a new one.");
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset successful");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <title>Reset Password | Dental Clinic</title>

      {/* Left branding panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#0D1B4A] to-[#060c28] flex-col items-center justify-center text-center px-12">
        <div>
          <p className="text-white text-[28px] font-bold leading-tight">
            DENTAL CLINIC
          </p>
          <p className="text-gray-300 text-[13px] tracking-wide">
            CARING FOR YOUR SMILE
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[45%] bg-white flex items-center justify-center px-6 sm:px-[40px] py-10">
        <div className="w-full max-w-md">
          <p className="lg:hidden text-[#003366] text-xl font-bold text-center mb-4">
            Dental Clinic
          </p>

          <h1 className="text-[#003366] text-2xl font-bold">Reset Password</h1>
          <p className="text-[14px] text-gray-500 mt-1 mb-6">
            Enter a new password for your patient account
          </p>

          {!token ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
              This reset link is invalid or missing its token. Please request a
              new link from the{" "}
              <Link to="/login" className="text-accent font-semibold no-underline">
                login page
              </Link>
              .
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${fieldCls} pr-12`}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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
              <input
                type={showPassword ? "text" : "password"}
                className={`${fieldCls} mt-4`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <p className="text-[12px] text-gray-400 mt-2">
                At least 10 characters, including a letter and a number.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 flex items-center justify-center bg-accent hover:bg-accent-dark disabled:opacity-70 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          <p className="text-center mt-6">
            <Link
              to="/login"
              className="text-[14px] text-gray-500 hover:text-[#003366] no-underline"
            >
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
