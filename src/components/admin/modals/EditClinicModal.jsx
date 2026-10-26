/**
 * Edit Clinic Modal
 *
 * Modal for editing an existing clinic.
 */
import React, { useState, useEffect } from "react";
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
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { useClinicMutations } from "../../../hooks/admin/useClinics";

const EditClinicModal = ({ open, onClose, clinic, onSuccess }) => {
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
  const { updateClinic, isUpdating } = useClinicMutations();

  // Populate form when clinic changes
  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        phone: clinic.phone || "",
        address: {
          street: clinic.address?.street || "",
          area: clinic.address?.area || "",
          city: clinic.address?.city || "",
          state: clinic.address?.state || "",
          pincode: clinic.address?.pincode || "",
        },
        isActive: clinic.isActive ?? true,
      });
    }
  }, [clinic]);

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

    updateClinic(
      { id: clinic._id, data },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to update clinic");
        },
      }
    );
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  if (!clinic) return null;

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
            <EditIcon />
            <Typography variant="h6" component="span" className="font-bold">
              Edit Clinic - {clinic.name}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isUpdating}>
            <CloseIcon className="text-white" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent className="p-6 mt-8">
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
        <Button onClick={handleClose} color="inherit" disabled={isUpdating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUpdating}
          className="bg-blue-600 hover:bg-blue-700"
          startIcon={isUpdating ? <CircularProgress size={16} /> : <EditIcon />}
        >
          {isUpdating ? "Updating..." : "Update Clinic"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClinicModal;
