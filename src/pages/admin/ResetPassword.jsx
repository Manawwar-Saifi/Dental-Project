/**
 * Admin Reset Password Page
 *
 * Reached from the reset link emailed to admin/staff users
 * (/admin/reset-password?token=xxx). Lets the user set a new password.
 *
 * - Reads the reset token from the URL query string
 * - New password + confirm password inputs
 * - POSTs to /auth/reset-password (via resetAdminPassword)
 * - On success: redirects to /admin/login with a success toast
 *
 * Styled to match the admin Login page theme.
 */
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "@mui/material";
import { toast } from "react-toastify";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import { resetAdminPassword } from "../../api/admin/auth.api";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Validate the new password fields.
   * Mirrors the backend rule: min 10 chars, at least one letter and one number.
   */
  const validate = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (
      password.length < 10 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      newErrors.password =
        "Must be at least 10 characters and include a letter and a number";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new link.");
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await resetAdminPassword(token, password);
      toast.success("Password reset successful");
      navigate("/admin/login", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not reset password. The link may have expired.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
              Reset Password
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Enter a new password for your admin account
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password}
              disabled={isSubmitting}
              className="mb-4"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon className="text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isSubmitting}
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
              placeholder="Enter new password"
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              disabled={isSubmitting}
              className="mt-5!"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              placeholder="Re-enter new password"
            />

            {/* Submit */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={isSubmitting}
              size="large"
              className="bg-accent hover:opacity-90 py-3 text-base font-medium mt-6"
            >
              {isSubmitting ? (
                <Box className="flex items-center gap-2">
                  <CircularProgress size={20} color="inherit" />
                  <span>Resetting...</span>
                </Box>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          {/* Back to Login link */}
          <Box className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/admin/login")}
              className="text-[14px] text-accent hover:underline bg-transparent border-none cursor-pointer"
            >
              ← Back to Login
            </button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminResetPassword;
