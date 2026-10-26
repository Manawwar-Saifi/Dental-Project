/**
 * Add Clinic Modal
 *
 * Modal for creating a new clinic.
 */
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { toast } from "react-toastify";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import { useClinicMutations } from "../../../hooks/admin/useClinics";

const AddClinicModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: {
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
    },
    isActive: true,
  });
  const { createClinic, isCreating } = useClinicMutations();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleAddressChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: e.target.value,
      },
    }));
  };

  const handleSwitchChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.checked,
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Clinic name is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    const data = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      isActive: formData.isActive,
    };

    createClinic(data, {
      onSuccess: () => {
        resetForm();
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to create clinic");
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      address: {
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
      },
      isActive: true,
    });
  };

  const handleClose = () => {
    if (!isCreating) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      {/* Header */}
      <DialogTitle className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <BusinessIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Add New Clinic
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-4">
        <Grid container spacing={3}>
          {/* Clinic Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Clinic Name *"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="e.g., Dental Clinic - Delhi Road"
              size="small"
            />
          </Grid>

          {/* Phone */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={formData.phone}
              onChange={handleChange("phone")}
              placeholder="e.g., 9876543210"
              size="small"
            />
          </Grid>

          {/* Address Section */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mb-2"
            >
              Address
            </Typography>
          </Grid>

          {/* Street */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={handleAddressChange("street")}
              placeholder="e.g., 123, Main Street"
              size="small"
            />
          </Grid>

          {/* Area */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Area / Locality"
              value={formData.address.area}
              onChange={handleAddressChange("area")}
              placeholder="e.g., Sector 12"
              size="small"
            />
          </Grid>

          {/* City */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="City"
              value={formData.address.city}
              onChange={handleAddressChange("city")}
              placeholder="e.g., Moradabad"
              size="small"
            />
          </Grid>

          {/* State */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="State"
              value={formData.address.state}
              onChange={handleAddressChange("state")}
              placeholder="e.g., Uttar Pradesh"
              size="small"
            />
          </Grid>

          {/* Pincode */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Pincode"
              value={formData.address.pincode}
              onChange={handleAddressChange("pincode")}
              placeholder="e.g., 244001"
              size="small"
            />
          </Grid>

          {/* Active Status */}
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleSwitchChange("isActive")}
                  color="success"
                />
              }
              label="Active (accepting appointments)"
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="p-4 bg-gray-50">
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700"
          startIcon={isCreating ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {isCreating ? "Creating..." : "Add Clinic"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClinicModal;
