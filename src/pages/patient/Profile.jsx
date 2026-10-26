import { useState } from "react";
import { filterName, NAME_PLACEHOLDER } from "../../utils/nameInput";
import { useAuthStore } from "../../store/auth.store";
import { updatePatientProfile } from "../../api/patient/patients.api";
import { changePatientPassword } from "../../api/auth.api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { toast } from "react-toastify";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

/**
 * Patient Profile Page
 *
 * Shows patient information with ability to edit certain fields.
 * Phone number change requires OTP verification (not implemented here).
 */
const Profile = () => {
  const { patient, updatePatient } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Change-password state
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChangePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error("All password fields are required");
      return;
    }
    if (pw.next.length < 10 || !/[A-Za-z]/.test(pw.next) || !/[0-9]/.test(pw.next)) {
      toast.error(
        "New password must be at least 10 characters and include a letter and a number",
      );
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPwLoading(true);
    try {
      await changePatientPassword(pw.current, pw.next);
      toast.success("Password updated successfully");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: patient?.name || "",
    email: patient?.email || "",
    address: patient?.address || "",
    emergencyContact: patient?.emergencyContact || "",
  });

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChange = (e) => {
    const { name } = e.target;
    // Patient name accepts letters, spaces and dots only (emergencyContact
    // combines name + phone, so it is intentionally left untouched here)
    const value = name === "name" ? filterName(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: patient?.name || "",
      email: patient?.email || "",
      address: patient?.address || "",
      emergencyContact: patient?.emergencyContact || "",
    });
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      await updatePatientProfile(patient._id, formData);
      updatePatient(formData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and update your personal information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "primary.main",
                  fontSize: "2rem",
                }}
              >
                {getInitials(patient?.name)}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {patient?.name || "Patient"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Patient ID: {patient?.patientId || "-"}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Read-only medical info */}
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Medical Information
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Blood Group
                  </Typography>
                  <Typography variant="body2">
                    {patient?.bloodGroup || "-"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Allergies
                  </Typography>
                  <Typography variant="body2">
                    {patient?.allergies?.length > 0
                      ? patient.allergies.join(", ")
                      : "None"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2">
                    {patient?.createdAt
                      ? new Date(patient.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Personal Information
                </Typography>
                {!isEditing && (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    variant="outlined"
                    size="small"
                  >
                    Edit
                  </Button>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    placeholder={NAME_PLACEHOLDER}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={patient?.phone ? `+91 ${patient.phone}` : ""}
                    disabled
                    helperText="Contact support to change phone number"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    value={
                      patient?.dateOfBirth
                        ? new Date(patient.dateOfBirth).toLocaleDateString(
                            "en-IN",
                          )
                        : ""
                    }
                    disabled
                    helperText="Contact support to update"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Emergency Contact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    placeholder="Name - Phone number"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Gender"
                    value={patient?.gender || ""}
                    disabled
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    mt: 3,
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={
                      loading ? <CircularProgress size={20} /> : <SaveIcon />
                    }
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <LockIcon color="action" fontSize="small" />
            <Typography variant="h6" fontWeight="bold">
              Change Password
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update the password you use for password login. OTP login always
            works regardless of your password.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPw ? "text" : "password"}
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                disabled={pwLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPw((s) => !s)}
                        edge="end"
                        size="small"
                        aria-label={showPw ? "Hide passwords" : "Show passwords"}
                      >
                        {showPw ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="New Password"
                type={showPw ? "text" : "password"}
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                disabled={pwLoading}
                helperText="Min 10 chars, a letter & a number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPw ? "text" : "password"}
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                disabled={pwLoading}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              startIcon={pwLoading ? <CircularProgress size={20} /> : <LockIcon />}
              onClick={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
