/**
 * Admin Login Page
 *
 * Email/Password based login for admin users.
 * Features:
 * - Form validation
 * - Error handling
 * - Loading states
 * - Remember me option
 * - Clean, professional design
 *
 * Uses:
 * - React Query for API calls (via useAdminAuth hook)
 * - Zustand for state management
 * - MUI components for UI
 * - Tailwind CSS for styling
 */
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { toast } from "react-toastify";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import { useAdminAuth } from "../../hooks/admin/useAdminAuth";
import { useAdminStore } from "../../store/admin.store";
import { forgotAdminPassword } from "../../api/admin/auth.api";
import { DEMO_LOGIN } from "../../demo/flag";

const AdminLogin = () => {
  // Form state
  const [email, setEmail] = useState(DEMO_LOGIN?.adminEmail ?? "");
  const [password, setPassword] = useState(DEMO_LOGIN?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot-password view state (toggled in-place, no separate route)
  const [view, setView] = useState("login"); // "login" | "forgot"
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});

  // Auth hook
  const { login, isLoggingIn, loginError } = useAdminAuth();
  const { isAuthenticated } = useAdminStore();

  // Show toast on login error
  useEffect(() => {
    if (loginError) {
      const message = loginError.response?.data?.message || loginError.message || "Login failed. Please try again.";
      toast.error(message);
    }
  }, [loginError]);

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  /**
   * Validate form fields
   * @returns {boolean} - Is form valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      login({ email, password });
    }
  };

  /**
   * Toggle password visibility
   */
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Submit the forgot-password request
   */
  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsSendingReset(true);
    try {
      await forgotAdminPassword(forgotEmail);
      setResetSent(true);
    } catch (err) {
      // Endpoint intentionally doesn't reveal whether the email exists; surface
      // a generic failure only if the request itself errors.
      const message =
        err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSendingReset(false);
    }
  };

  /**
   * Return to the login form, resetting the forgot-password view
   */
  const backToLogin = () => {
    setView("login");
    setResetSent(false);
    setForgotEmail("");
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          {/* Logo & Title */}
          <Box className="text-center mb-8">
            <Box className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <MedicalServicesIcon className="text-blue-600 text-3xl" />
            </Box>
            <Typography variant="h4" className="font-bold text-gray-800 mb-2">
              {view === "forgot" ? "Reset Password" : "Admin Login"}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              {view === "forgot"
                ? "Enter your email and we'll send you a reset link"
                : "Sign in to access the admin panel"}
            </Typography>
          </Box>

          {/* Login Form */}
          {view === "login" && (
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email}
              disabled={isLoggingIn}
              className="mb-4"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              placeholder="admin@example.com"
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password}
              disabled={isLoggingIn}
              className="mt-5!"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon className="text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isLoggingIn}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon className="text-gray-400" />
                      ) : (
                        <VisibilityIcon className="text-gray-400" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder="Enter your password"
            />

            {/* Remember Me */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoggingIn}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" className="text-gray-600">
                  Remember me
                </Typography>
              }
              className="mb-6"
            />

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={isLoggingIn}
              size="large"
              className="bg-blue-600 hover:bg-blue-700 py-3 text-base font-medium"
            >
              {isLoggingIn ? (
                <Box className="flex items-center gap-2">
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing in...</span>
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Forgot Password link */}
            <Box className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setView("forgot")}
                disabled={isLoggingIn}
                className="text-[14px] text-accent hover:underline bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </Box>
          </form>
          )}

          {/* Forgot Password Form */}
          {view === "forgot" && (
          <Box>
            {resetSent ? (
              <Box className="text-center">
                <Typography variant="body1" className="text-green-600 font-medium mb-2">
                  If this email exists, a reset link has been sent
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  Please check your inbox and follow the link to reset your
                  password.
                </Typography>
              </Box>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isSendingReset}
                  className="mb-4"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="admin@example.com"
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={isSendingReset}
                  size="large"
                  className="bg-accent hover:opacity-90 py-3 text-base font-medium mt-4"
                >
                  {isSendingReset ? (
                    <Box className="flex items-center gap-2">
                      <CircularProgress size={20} color="inherit" />
                      <span>Sending...</span>
                    </Box>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login link */}
            <Box className="mt-4 text-center">
              <button
                type="button"
                onClick={backToLogin}
                className="text-[14px] text-accent hover:underline bg-transparent border-none cursor-pointer"
              >
                ← Back to Login
              </button>
            </Box>
          </Box>
          )}

          {/* Footer */}
          <Box className="mt-6 text-center">
            <Typography variant="body2" className="text-gray-400">
              Dental Clinic CMS - Admin Panel
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLogin;
