/**
 * Add User Modal
 *
 * Modal for creating a new staff/admin user.
 */
import { useState, useEffect } from "react";
import { filterName, NAME_PLACEHOLDER } from "../../../utils/nameInput";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useUserMutations } from "../../../hooks/admin/useUsers";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Staff" },
  { value: "blog_editor", label: "SEO Executive" },
  { value: "clinic_manager", label: "Clinic Manager" },
];

const AddUserModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { createUserAsync, isCreating } = useUserMutations();

  useEffect(() => {
    if (open) {
      setFormData({ name: "", email: "", phone: "", password: "", role: "user" });
      setShowPassword(false);
    }
  }, [open]);

  const handleChange = (field) => (e) => {
    const value = field === "name" ? filterName(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return toast.error("Invalid email format");
    if (!formData.phone.trim()) return toast.error("Phone is required");
    if (!/^[6-9]\d{9}$/.test(formData.phone))
      return toast.error("Phone must be a valid 10-digit Indian number");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    try {
      await createUserAsync({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleClose = () => {
    if (!isCreating) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="bg-linear-to-r from-purple-600 to-purple-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <PersonAddIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Add Staff Member
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-6 mt-4">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Full Name *"
              value={formData.name}
              onChange={handleChange("name")}
              size="small"
              placeholder={NAME_PLACEHOLDER}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              size="small"
              placeholder="e.g., rahul@clinic.com"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone *"
              value={formData.phone}
              onChange={handleChange("phone")}
              size="small"
              placeholder="e.g., 9876543210"
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Password *"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange("password")}
              size="small"
              placeholder="Min 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Role *"
              value={formData.role}
              onChange={handleChange("role")}
              size="small"
            >
              {roleOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          className="bg-purple-600 hover:bg-purple-700"
          startIcon={
            isCreating ? <CircularProgress size={16} /> : <PersonAddIcon />
          }
        >
          {isCreating ? "Creating..." : "Add Staff Member"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;
