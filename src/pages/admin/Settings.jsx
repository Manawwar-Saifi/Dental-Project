/**
 * Admin Settings Page
 *
 * Comprehensive settings management with tabs for:
 * - Profile Settings
 * - Clinic Settings
 * - Notification Preferences
 * - System Configuration
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  MenuItem,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Avatar,
  Skeleton,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import WebIcon from "@mui/icons-material/Web";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  useProfile,
  useProfileMutations,
  useClinicSettings,
  useClinicSettingsMutations,
  useNotificationPreferences,
  useNotificationPreferencesMutations,
  useSystemConfig,
  useSystemConfigMutations,
} from "../../hooks/admin/useSettings";

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const Settings = () => {
  const [searchParams] = useSearchParams();
  const initialTab = parseInt(searchParams.get("tab")) || 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch data using hooks
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: clinicData, isLoading: clinicLoading } = useClinicSettings();
  const { data: notificationData, isLoading: notificationLoading } = useNotificationPreferences();
  const { data: systemData, isLoading: systemLoading } = useSystemConfig();

  // Mutations
  const {
    updateProfile,
    isUpdatingProfile,
    uploadPicture,
    isUploadingPicture,
    changePassword,
    isChangingPassword,
  } = useProfileMutations();
  const { updateClinicSettings, isUpdating: isUpdatingClinic } = useClinicSettingsMutations();
  const { updatePreferences, isUpdating: isUpdatingNotifications } = useNotificationPreferencesMutations();
  const { updateConfig, isUpdating: isUpdatingSystem } = useSystemConfigMutations();

  // Local form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [clinicForm, setClinicForm] = useState({
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    workingHours: {
      openTime: "09:00",
      closeTime: "18:00",
      workingDays: "",
    },
  });

  const [notificationForm, setNotificationForm] = useState({
    email: {
      appointments: true,
      payments: true,
      systemAlerts: true,
    },
    sms: {
      appointments: false,
      payments: false,
      systemAlerts: false,
    },
  });

  const [systemForm, setSystemForm] = useState({
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  });

  const [popupForm, setPopupForm] = useState({
    enabled: true,
    delaySeconds: 5,
    showOnAllPages: true,
    pages: ["/", "/treatments", "/contact", "/membership-plans", "/book-appointment"],
    newPage: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("popup_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPopupForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const handleSavePopup = () => {
    const { newPage, ...configToSave } = popupForm;
    localStorage.setItem("popup_config", JSON.stringify(configToSave));
    toast.success("Popup settings saved successfully");
  };

  const handleAddPage = () => {
    const page = popupForm.newPage.trim();
    if (page && !popupForm.pages.includes(page)) {
      setPopupForm((prev) => ({
        ...prev,
        pages: [...prev.pages, page.startsWith("/") ? page : "/" + page],
        newPage: "",
      }));
    }
  };

  const handleRemovePage = (pageToRemove) => {
    setPopupForm((prev) => ({
      ...prev,
      pages: prev.pages.filter((p) => p !== pageToRemove),
    }));
  };

  // Initialize forms when data loads
  useEffect(() => {
    if (profileData?.data?.user) {
      const user = profileData.data.user;
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [profileData]);

  useEffect(() => {
    if (clinicData?.data) {
      const data = clinicData.data;
      setClinicForm({
        clinicName: data.clinicName || "",
        clinicPhone: data.clinicPhone || "",
        clinicEmail: data.clinicEmail || "",
        address: {
          street: data.address?.street || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          pincode: data.address?.pincode || "",
        },
        workingHours: {
          openTime: data.workingHours?.openTime || "09:00",
          closeTime: data.workingHours?.closeTime || "18:00",
          workingDays: data.workingHours?.workingDays || "",
        },
      });
    }
  }, [clinicData]);

  useEffect(() => {
    if (notificationData?.data?.preferences) {
      setNotificationForm(notificationData.data.preferences);
    }
  }, [notificationData]);

  useEffect(() => {
    if (systemData?.data?.config) {
      setSystemForm(systemData.data.config);
    }
  }, [systemData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Profile handlers
  const handleProfileChange = (field) => (e) => {
    setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = () => {
    updateProfile(
      { name: profileForm.name, email: profileForm.email, phone: profileForm.phone },
      {
        onSuccess: () => toast.success("Profile updated successfully!"),
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update profile"),
      }
    );
  };

  const handleChangePassword = () => {
    if (!profileForm.currentPassword || !profileForm.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (profileForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    changePassword(
      {
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword,
        confirmPassword: profileForm.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password changed successfully!");
          setProfileForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to change password"),
      }
    );
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      uploadPicture(file, {
        onSuccess: () => toast.success("Profile picture updated!"),
        onError: (err) => toast.error(err.response?.data?.message || "Failed to upload picture"),
      });
    }
  };

  // Clinic handlers
  const handleClinicChange = (field) => (e) => {
    setClinicForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAddressChange = (field) => (e) => {
    setClinicForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: e.target.value },
    }));
  };

  const handleWorkingHoursChange = (field) => (e) => {
    setClinicForm((prev) => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: e.target.value },
    }));
  };

  const handleSaveClinic = () => {
    updateClinicSettings(clinicForm, {
      onSuccess: () => toast.success("Clinic settings updated successfully!"),
      onError: (err) => toast.error(err.response?.data?.message || "Failed to update clinic settings"),
    });
  };

  // Notification handlers
  const handleEmailNotificationChange = (field) => (e) => {
    setNotificationForm((prev) => ({
      ...prev,
      email: { ...prev.email, [field]: e.target.checked },
    }));
  };

  const handleSmsNotificationChange = (field) => (e) => {
    setNotificationForm((prev) => ({
      ...prev,
      sms: { ...prev.sms, [field]: e.target.checked },
    }));
  };

  const handleSaveNotifications = () => {
    updatePreferences(notificationForm, {
      onSuccess: () => toast.success("Notification preferences updated successfully!"),
      onError: (err) => toast.error(err.response?.data?.message || "Failed to update preferences"),
    });
  };

  // System handlers
  const handleSystemChange = (field) => (e) => {
    setSystemForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveSystem = () => {
    updateConfig(systemForm, {
      onSuccess: () => toast.success("System settings updated successfully!"),
      onError: (err) => toast.error(err.response?.data?.message || "Failed to update settings"),
    });
  };

  const user = profileData?.data?.user;

  return (
    <Box>
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your profile, clinic, notifications, and system preferences
        </Typography>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<PersonIcon />} label="Profile" iconPosition="start" />
            <Tab icon={<BusinessIcon />} label="Clinic" iconPosition="start" />
            <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="System" iconPosition="start" />
            <Tab icon={<WebIcon />} label="Popup" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Profile Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            {profileLoading ? (
              <Box className="space-y-4">
                <Skeleton variant="circular" width={100} height={100} />
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            ) : (
              <>
                {/* Profile Picture */}
                <Box className="flex items-center gap-4 mb-6">
                  <Box className="relative">
                    <Avatar
                      src={user?.profilePicture?.url}
                      sx={{ width: 100, height: 100, fontSize: "2rem" }}
                      className="bg-teal-600"
                    >
                      {user?.name?.[0]?.toUpperCase() || "A"}
                    </Avatar>
                    <IconButton
                      onClick={handleProfilePictureClick}
                      disabled={isUploadingPicture}
                      className="absolute bottom-0 right-0 bg-teal-600 hover:bg-teal-700 text-white"
                      size="small"
                    >
                      {isUploadingPicture ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CameraAltIcon fontSize="small" />
                      )}
                    </IconButton>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </Box>
                  <Box>
                    <Typography variant="h6">{user?.name || "Admin"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" className="font-semibold mb-7!">
                  Personal Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileForm.name}
                      onChange={handleProfileChange("name")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange("email")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileForm.phone}
                      onChange={handleProfileChange("phone")}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={isUpdatingProfile ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" className="font-semibold mb-5!">
                  Change Password
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type={showPassword ? "text" : "password"}
                      value={profileForm.currentPassword}
                      onChange={handleProfileChange("currentPassword")}
                      placeholder="Admin@123"
                      helperText="Default: Admin@123 (click eye to reveal)"
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type={showPassword ? "text" : "password"}
                      value={profileForm.newPassword}
                      onChange={handleProfileChange("newPassword")}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type={showPassword ? "text" : "password"}
                      value={profileForm.confirmPassword}
                      onChange={handleProfileChange("confirmPassword")}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={isChangingPassword ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    color="warning"
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </TabPanel>

        {/* Clinic Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            {clinicLoading ? (
              <Box className="space-y-4">
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={100} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            ) : (
              <>
                <Typography variant="h6" className="font-semibold mb-8!">
                  Clinic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Clinic Name"
                      value={clinicForm.clinicName}
                      onChange={handleClinicChange("clinicName")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={clinicForm.clinicPhone}
                      onChange={handleClinicChange("clinicPhone")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={clinicForm.clinicEmail}
                      onChange={handleClinicChange("clinicEmail")}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" className="font-semibold mb-4">
                  Address
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      multiline
                      rows={2}
                      value={clinicForm.address.street}
                      onChange={handleAddressChange("street")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="City"
                      value={clinicForm.address.city}
                      onChange={handleAddressChange("city")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="State"
                      value={clinicForm.address.state}
                      onChange={handleAddressChange("state")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      value={clinicForm.address.pincode}
                      onChange={handleAddressChange("pincode")}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" className="font-semibold mb-7!">
                  Working Hours
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Opening Time"
                      type="time"
                      value={clinicForm.workingHours.openTime}
                      onChange={handleWorkingHoursChange("openTime")}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Closing Time"
                      type="time"
                      value={clinicForm.workingHours.closeTime}
                      onChange={handleWorkingHoursChange("closeTime")}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Working Days"
                      value={clinicForm.workingHours.workingDays}
                      onChange={handleWorkingHoursChange("workingDays")}
                      placeholder="e.g., Monday to Saturday"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    startIcon={isUpdatingClinic ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSaveClinic}
                    disabled={isUpdatingClinic}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isUpdatingClinic ? "Saving..." : "Save Clinic Settings"}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </TabPanel>

        {/* Notification Preferences Tab */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            {notificationLoading ? (
              <Box className="space-y-4">
                <Skeleton variant="rectangular" height={50} />
                <Skeleton variant="rectangular" height={50} />
                <Skeleton variant="rectangular" height={50} />
              </Box>
            ) : (
              <>
                <Typography variant="h6" className="font-semibold mb-4">
                  Email Notifications
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationForm.email?.appointments ?? true}
                        onChange={handleEmailNotificationChange("appointments")}
                        color="success"
                      />
                    }
                    label="Appointment Reminders"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                    Receive email notifications about appointments
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationForm.email?.payments ?? true}
                        onChange={handleEmailNotificationChange("payments")}
                        color="success"
                      />
                    }
                    label="Payment Alerts"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                    Get notified about payment transactions
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationForm.email?.systemAlerts ?? true}
                        onChange={handleEmailNotificationChange("systemAlerts")}
                        color="success"
                      />
                    }
                    label="System Alerts"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                    Important system notifications and alerts
                  </Typography>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" className="font-semibold mb-4">
                  SMS Notifications
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationForm.sms?.appointments ?? false}
                        onChange={handleSmsNotificationChange("appointments")}
                        color="success"
                      />
                    }
                    label="Appointment Reminders"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                    Receive SMS notifications about appointments
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationForm.sms?.payments ?? false}
                        onChange={handleSmsNotificationChange("payments")}
                        color="success"
                      />
                    }
                    label="Payment Alerts"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                    Get SMS alerts about payment transactions
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationForm.sms?.systemAlerts ?? false}
                        onChange={handleSmsNotificationChange("systemAlerts")}
                        color="success"
                      />
                    }
                    label="System Alerts"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                    Important system notifications via SMS
                  </Typography>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    startIcon={isUpdatingNotifications ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSaveNotifications}
                    disabled={isUpdatingNotifications}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isUpdatingNotifications ? "Saving..." : "Save Notification Preferences"}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </TabPanel>

        {/* System Configuration Tab */}
        <TabPanel value={activeTab} index={3}>
          <CardContent>
            {systemLoading ? (
              <Box className="space-y-4">
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            ) : (
              <>
                <Typography variant="h6" className="font-semibold mb-4">
                  Regional Settings
                </Typography>
                <Grid container spacing={3} className="mt-5">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Timezone"
                      value={systemForm.timezone}
                      onChange={handleSystemChange("timezone")}
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                      <MenuItem value="Asia/Dubai">Asia/Dubai (GST)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Currency"
                      value={systemForm.currency}
                      onChange={handleSystemChange("currency")}
                    >
                      <MenuItem value="INR">INR - Indian Rupee (₹)</MenuItem>
                      <MenuItem value="USD">USD - US Dollar ($)</MenuItem>
                      <MenuItem value="EUR">EUR - Euro (€)</MenuItem>
                      <MenuItem value="GBP">GBP - British Pound (£)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Language"
                      value={systemForm.language}
                      onChange={handleSystemChange("language")}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="mr">Marathi</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" className="font-semibold mb-4">
                  Display Formats
                </Typography>
                <Grid container spacing={3} className="mt-5">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Date Format"
                      value={systemForm.dateFormat}
                      onChange={handleSystemChange("dateFormat")}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Time Format"
                      value={systemForm.timeFormat}
                      onChange={handleSystemChange("timeFormat")}
                    >
                      <MenuItem value="12h">12 Hour (AM/PM)</MenuItem>
                      <MenuItem value="24h">24 Hour</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    startIcon={isUpdatingSystem ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSaveSystem}
                    disabled={isUpdatingSystem}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isUpdatingSystem ? "Saving..." : "Save System Settings"}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </TabPanel>

        {/* Popup Settings Tab */}
        <TabPanel value={activeTab} index={4}>
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Popup Enquiry Form Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure the popup enquiry form that appears on public pages.
            </Typography>

            <Grid container spacing={3} className="mt-2">
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={popupForm.enabled}
                      onChange={(e) => setPopupForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                    />
                  }
                  label="Enable Popup Enquiry Form"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Delay (seconds)"
                  value={popupForm.delaySeconds}
                  onChange={(e) => setPopupForm((prev) => ({ ...prev, delaySeconds: parseInt(e.target.value) || 5 }))}
                  helperText="How many seconds after page load before the popup appears"
                  slotProps={{ input: { inputProps: { min: 1, max: 120 } } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={popupForm.showOnAllPages}
                      onChange={(e) => setPopupForm((prev) => ({ ...prev, showOnAllPages: e.target.checked }))}
                    />
                  }
                  label="Show on all public pages"
                />
              </Grid>

              {!popupForm.showOnAllPages && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Show popup only on these pages:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    {popupForm.pages.map((page) => (
                      <Box
                        key={page}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          bgcolor: "#e8f4fd",
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>{page}</Typography>
                        <IconButton size="small" onClick={() => handleRemovePage(page)}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="/page-path"
                      value={popupForm.newPage}
                      onChange={(e) => setPopupForm((prev) => ({ ...prev, newPage: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddPage(); }}
                    />
                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddPage}>
                      Add
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePopup}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Save Popup Settings
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

      </Card>
    </Box>
  );
};

export default Settings;
