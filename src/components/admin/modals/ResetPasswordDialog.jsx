/**
 * Reset / Set Patient Password (admin)
 *
 * Admins can SET a specific password or GENERATE a one-time temporary password.
 * Existing passwords are hashed and NEVER viewable — there is no "show current
 * password" capability here by design.
 */
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { toast } from "react-toastify";
import { resetPatientPassword } from "../../../api/admin/patients.api";

const isStrong = (pw) =>
  typeof pw === "string" && pw.length >= 10 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);

const ResetPasswordDialog = ({ open, onClose, patient }) => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null); // shown once after generate

  const reset = () => {
    setNewPassword("");
    setShowPassword(false);
    setLoading(false);
    setTempPassword(null);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSet = async () => {
    if (!isStrong(newPassword)) {
      toast.error(
        "Password must be at least 10 characters and include a letter and a number",
      );
      return;
    }
    setLoading(true);
    try {
      await resetPatientPassword(patient._id, { newPassword });
      toast.success("Password updated");
      reset();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await resetPatientPassword(patient._id, { generate: true });
      const temp = res?.data?.temporaryPassword;
      if (temp) {
        setTempPassword(temp);
        toast.success("Temporary password generated");
      } else {
        toast.error("No temporary password returned");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate password");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <LockResetIcon color="primary" />
          <span className="font-semibold">Reset Password</span>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {patient?.name ? `For ${patient.name}` : ""} — existing passwords can't be viewed, only reset.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {tempPassword ? (
          // One-time temp password reveal
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Share this temporary password with the patient. It won't be shown again.
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "grey.100",
                border: "1px solid",
                borderColor: "grey.300",
              }}
            >
              <Typography className="font-mono" sx={{ flex: 1, wordBreak: "break-all" }}>
                {tempPassword}
              </Typography>
              <IconButton size="small" onClick={handleCopy} title="Copy">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box className="flex flex-col gap-3">
            <TextField
              fullWidth
              size="small"
              label="New password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              helperText="Min 10 chars, with a letter and a number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box className="flex items-center gap-2">
              <Divider sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">or</Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Button
              variant="outlined"
              startIcon={<AutorenewIcon />}
              onClick={handleGenerate}
              disabled={loading}
            >
              Generate temporary password
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions className="p-3">
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          {tempPassword ? "Done" : "Cancel"}
        </Button>
        {!tempPassword && (
          <Button
            variant="contained"
            onClick={handleSet}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <LockResetIcon />}
          >
            {loading ? "Saving..." : "Set Password"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ResetPasswordDialog;
